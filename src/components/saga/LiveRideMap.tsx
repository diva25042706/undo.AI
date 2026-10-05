// ============================================================================
// UNDO.AI — LIVE INTERACTIVE CHENNAI RIDE MAP & FLEET TELEMETRY
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// (Synthetic Chennai OMR Corridor Simulator for Transactional Saga State)
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GeoCoordinate,
  getCoordinateForLocation,
  generateSyntheticRoute,
  CHENNAI_GEO_REGISTRY,
} from '../../engine/chennaiGeo';
import { WorkflowRuntimeState } from '../../engine/sagaEngine';
import {
  MapPin,
  Flag,
  Car,
  ShieldCheck,
  RotateCcw,
  Compass,
  CreditCard,
  UserCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  Navigation,
} from 'lucide-react';

interface LiveRideMapProps {
  sagaState: WorkflowRuntimeState;
}

export const LiveRideMap: React.FC<LiveRideMapProps> = ({ sagaState }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  const instance = sagaState.instance;
  const params = instance.parameters || {};

  // Extract dynamic parameters
  const pickupName = params.pickup || params.pickupLocation || 'Thiruvanmiyur';
  const dropName = params.drop || params.dropLocation || 'Sholinganallur';
  const driverName = params.driverName || 'Murugan K';
  const driverId = params.driverId || 'DRV-CHN-1042';
  const rideId = params.rideId || params.transactionId || 'RIDE-CHN-4491';
  const fare = params.fare || instance.parameters.price || 420;

  // Synthetic Chennai Coordinates
  const driverStartCoord: GeoCoordinate = CHENNAI_GEO_REGISTRY.driver_base || {
    lat: 13.0000,
    lng: 80.2500,
    name: 'Driver Starting Base',
  };
  const pickupCoord = getCoordinateForLocation(pickupName);
  const dropCoord = getCoordinateForLocation(dropName);

  // Generate synthetic multi-point route
  const routePoints = generateSyntheticRoute(driverStartCoord, pickupCoord, dropCoord, 12);

  // Saga State flags
  const currentStep = sagaState.currentStepIndex;
  const isCrashed = sagaState.isSimulatedCrash || sagaState.status === 'CRASHED';
  const isFailed = sagaState.status === 'FAILED' || sagaState.status === 'PARTIALLY_RECOVERED';
  const isCompensating = sagaState.status === 'COMPENSATING';
  const isRestored = sagaState.status === 'RECOVERED' || sagaState.isWorldRestored;
  const isCompleted = sagaState.status === 'COMPLETED';
  const isRunning = sagaState.status === 'RUNNING';

  // Live driver animation interval during active execution
  useEffect(() => {
    let interval: any;
    if (isRunning && currentStep >= 2) {
      interval = setInterval(() => {
        setSimulatedProgress((prev) => (prev < routePoints.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else if (isRestored || isFailed || isCrashed || isCompensating) {
      // Immediately freeze movement upon rollback or failure
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentStep, isRestored, isFailed, isCrashed, isCompensating, routePoints.length]);

  // Compute exact waypoint position based on state
  let currentWaypointIndex = 0;
  if (isRestored) {
    currentWaypointIndex = 0; // Driver returned to fleet base
  } else if (isCompleted) {
    currentWaypointIndex = routePoints.length - 1; // Destination reached
  } else if (isCompensating || isFailed || isCrashed) {
    // Frozen at checkpoint
    currentWaypointIndex = Math.min(Math.max(1, (currentStep + 1) * 2), routePoints.length - 2);
  } else if (isRunning) {
    if (currentStep === 0) currentWaypointIndex = 0;
    else if (currentStep === 1) currentWaypointIndex = 2; // Moving to pickup
    else if (currentStep === 2) currentWaypointIndex = 3; // At pickup
    else currentWaypointIndex = Math.max(3, Math.min(simulatedProgress, routePoints.length - 2));
  }

  const currentDriverPos = routePoints[currentWaypointIndex] || [driverStartCoord.lat, driverStartCoord.lng];

  // UI labels & status badges
  let rideStatusLabel = 'STANDBY';
  let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
  let driverStatus = 'AVAILABLE (In Fleet Pool)';

  if (isRestored) {
    rideStatusLabel = 'RIDE CANCELLED • WORLD RESTORED ✓';
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400';
    driverStatus = 'AVAILABLE (Returned to Fleet)';
  } else if (isCompensating) {
    rideStatusLabel = 'ROLLING BACK (Topological Undo)';
    badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-400 animate-pulse';
    driverStatus = 'RELEASING FLEET LOCK';
  } else if (isFailed) {
    rideStatusLabel = 'WORKFLOW FAULT (Movement Halted)';
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400';
    driverStatus = 'HALTED AT CHECKPOINT';
  } else if (isCrashed) {
    rideStatusLabel = 'AGENT CRASHED (Checkpoint Saved)';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400';
    driverStatus = 'FROZEN IN DURABLE LOG';
  } else if (isRunning) {
    if (currentStep === 0) {
      rideStatusLabel = 'DISPATCHING CHENNAI FLEET';
      driverStatus = 'SEARCHING';
    } else if (currentStep === 1) {
      rideStatusLabel = 'DRIVER ASSIGNED';
      driverStatus = 'EN ROUTE TO PICKUP';
    } else if (currentStep === 2) {
      rideStatusLabel = 'CAB RESERVED & LOCKED';
      driverStatus = 'ARRIVED AT PICKUP';
    } else {
      rideStatusLabel = 'RIDE ACTIVE (Trip in Progress)';
      badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-400 animate-pulse';
      driverStatus = 'TRANSIT ON OMR EXPRESSWAY';
    }
  } else if (isCompleted) {
    rideStatusLabel = 'TRIP COMPLETED SUCCESSFULLY';
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400';
    driverStatus = 'TRIP COMPLETED';
  }

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.0108, 80.2668],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Standard OpenStreetMap Tiles (Zero API key requirement)
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: 'abc',
      });

      tileLayer.on('tileerror', () => {
        console.error('[UNDO.AI MAP] OpenStreetMap tile loading warning/error');
        setTileErrorCount((prev) => prev + 1);
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
      setIsMapLoaded(true);
    }

    const map = mapInstanceRef.current;

    // Custom DivIcon: Pickup Marker (📍)
    const pickupIcon = L.divIcon({
      className: 'custom-pickup-divicon',
      html: `
        <div style="background: #10b981; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(16,185,129,0.6); border: 2.5px solid white; cursor: pointer;">
          📍
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickupCoord.lat, pickupCoord.lng]);
    } else {
      pickupMarkerRef.current = L.marker([pickupCoord.lat, pickupCoord.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<strong>📍 Pickup:</strong> ${pickupName}<br><span style="font-size:11px;color:#64748b;">Synthetic GPS: ${pickupCoord.lat}, ${pickupCoord.lng}</span>`);
    }

    // Custom DivIcon: Destination Marker (🏁)
    const dropIcon = L.divIcon({
      className: 'custom-drop-divicon',
      html: `
        <div style="background: #e11d48; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(225,29,72,0.6); border: 2.5px solid white; cursor: pointer;">
          🏁
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    if (dropMarkerRef.current) {
      dropMarkerRef.current.setLatLng([dropCoord.lat, dropCoord.lng]);
    } else {
      dropMarkerRef.current = L.marker([dropCoord.lat, dropCoord.lng], { icon: dropIcon })
        .addTo(map)
        .bindPopup(`<strong>🏁 Destination:</strong> ${dropName}<br><span style="font-size:11px;color:#64748b;">Synthetic GPS: ${dropCoord.lat}, ${dropCoord.lng}</span>`);
    }

    // Full Route Polyline
    const polylineColor = isRestored ? '#94a3b8' : isFailed ? '#f43f5e' : '#4f46e5';
    const polylineOptions = {
      color: polylineColor,
      weight: 5,
      opacity: 0.85,
      dashArray: isRestored ? '8, 8' : undefined,
    };

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(routePoints).setStyle(polylineOptions);
    } else {
      routePolylineRef.current = L.polyline(routePoints, polylineOptions).addTo(map);
    }

    // Auto Fit Map Bounds to entire route
    const allBounds = L.latLngBounds([
      [driverStartCoord.lat, driverStartCoord.lng],
      [pickupCoord.lat, pickupCoord.lng],
      [dropCoord.lat, dropCoord.lng],
      currentDriverPos,
    ]);
    map.fitBounds(allBounds, { padding: [50, 50] });

    // Invalidate size after mounting to prevent blank tiles
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        pickupMarkerRef.current = null;
        dropMarkerRef.current = null;
        driverMarkerRef.current = null;
        routePolylineRef.current = null;
      }
    };
  }, [pickupName, dropName, isRestored, isFailed]);

  // Update Driver Marker Dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const vehicleBg = isRestored
      ? '#10b981'
      : isFailed
      ? '#f43f5e'
      : isCompensating
      ? '#a855f7'
      : isRunning
      ? '#4f46e5'
      : '#334155';

    const driverIcon = L.divIcon({
      className: 'custom-driver-divicon',
      html: `
        <div style="background: ${vehicleBg}; color: white; width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.4); border: 2.5px solid white; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);">
          🚗
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(currentDriverPos).setIcon(driverIcon);
    } else {
      driverMarkerRef.current = L.marker(currentDriverPos, { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<strong>🚗 Driver:</strong> ${driverName} (${driverId})<br><strong>Status:</strong> ${driverStatus}`);
    }
  }, [currentDriverPos, isRestored, isFailed, isCompensating, isRunning, driverName, driverId, driverStatus]);

  const handleRetryMap = () => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.redraw();
      mapInstanceRef.current.invalidateSize();
      setTileErrorCount(0);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Live Chennai Ride Route & Fleet Telemetry
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                SYNTHETIC GPS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                DEMO LOCATION
              </span>
            </div>
            <p className="text-xs text-slate-500">
              OpenStreetMap tile engine synchronized with runtime Saga state • OMR Chennai IT Corridor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tile Status Diagnostic Indicator */}
          <div className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tileErrorCount === 0 ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span>Tiles: ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-500" />
                <span>Tiles: DEGRADED</span>
                <button
                  onClick={handleRetryMap}
                  className="ml-1 text-indigo-600 dark:text-indigo-400 underline font-bold hover:opacity-80"
                >
                  Retry
                </button>
              </>
            )}
          </div>

          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${badgeColor}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {rideStatusLabel}
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Map (~65%) + Telemetry Panel (~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Container (8 of 12 cols on Desktop = ~66%) */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative w-full h-[480px] min-h-[480px] bg-slate-100 dark:bg-slate-800 z-0">
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 z-10 text-xs font-mono text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-indigo-500" />
              Loading OpenStreetMap tiles...
            </div>
          )}

          {/* Leaflet DOM Anchor with explicit 100% dimensions */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[480px] z-0" />

          {/* Floating Driver Telemetry Overlay on Map */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
              <span className="text-base">🚗</span>
              <span>{driverName} ({driverId})</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span>Lat: {currentDriverPos[0].toFixed(4)}</span>
              <span>•</span>
              <span>Lng: {currentDriverPos[1].toFixed(4)}</span>
            </div>
          </div>

          {/* Map Route Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-[11px] font-mono flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              📍 <span className="font-semibold">{pickupName}</span>
            </span>
            <span className="text-slate-400">➔</span>
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              🏁 <span className="font-semibold">{dropName}</span>
            </span>
          </div>
        </div>

        {/* Live Ride Status Card (4 of 12 cols on Desktop = ~34%) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Active Ride Telemetry
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {rideId}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Pickup:
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{pickupName}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-rose-500" /> Destination:
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{dropName}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Driver:
                </span>
                <strong className="text-slate-900 dark:text-white font-semibold">{driverName}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" /> Trip Fare:
                </span>
                <strong className="text-slate-900 dark:text-white font-mono font-extrabold text-sm">
                  ₹{Number(fare).toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Driver State:</span>
                <span className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                  {driverStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Saga Execution Synchronization Info */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                Saga Invariant Synchronization
              </h5>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {isRestored ? (
                <span className="text-emerald-700 dark:text-emerald-300 font-bold block">
                  ✓ Compensation verified: Ride cancelled, driver released back to dispatch pool, and fare ₹{Number(fare).toLocaleString('en-IN')} refunded.
                </span>
              ) : isFailed ? (
                <span className="text-rose-700 dark:text-rose-300 font-bold block">
                  ✕ Fault triggered mid-flight. Driver vehicle motion halted at checkpoint #{currentStep + 1}. Click UNDO to rollback.
                </span>
              ) : isCompensating ? (
                <span className="text-purple-700 dark:text-purple-300 font-bold block">
                  🔄 Saga compensation executing in reverse topological order. Releasing fleet driver lock...
                </span>
              ) : (
                <span>
                  Map position is driven directly by the Saga execution engine state machine. Movements commit checkpoint tokens at every step.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
