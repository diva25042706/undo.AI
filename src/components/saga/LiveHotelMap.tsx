// ============================================================================
// UNDO.AI — LIVE INTERACTIVE CHENNAI HOTEL INVENTORY MAP & DISCOVERY ENGINE
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// (Synthetic Chennai Spatial Haversine Engine & Deterministic Saga Visualizer)
// ============================================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CHENNAI_HOTELS,
  ChennaiHotelLocation,
  discoverNearestAvailableHotel,
  DEFAULT_CUSTOMER_LOCATION,
} from '../../engine/chennaiGeo';
import { WorkflowRuntimeState } from '../../engine/sagaEngine';
import {
  Building2,
  CheckCircle2,
  RotateCcw,
  CreditCard,
  Ticket,
  Mail,
  ShieldCheck,
  MapPin,
  Star,
  Users,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Navigation,
  Filter,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface LiveHotelMapProps {
  sagaState: WorkflowRuntimeState;
}

export const LiveHotelMap: React.FC<LiveHotelMapProps> = ({ sagaState }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hotelMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const connectionLineRef = useRef<L.Polyline | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);

  const instance = sagaState.instance;
  const params = instance.parameters || {};

  // Customer search location
  const searchLocation = params.searchLocation || params.area || params.location || 'Nungambakkam';
  
  // Discover hotels and compute Haversine distances
  const discovery = useMemo(() => {
    return discoverNearestAvailableHotel(searchLocation);
  }, [searchLocation]);

  const nearestHotel = discovery.selectedNearestHotel;
  const selectedHotelName = params.hotelName || params.hotel || nearestHotel.hotelName;
  const selectedHotelId = params.hotelId || nearestHotel.hotelId;
  const selectedArea = nearestHotel.area || searchLocation;
  const roomType = params.roomType || nearestHotel.roomType || 'Deluxe Room';
  const roomPrice = typeof params.roomPrice === 'number' ? params.roomPrice : (nearestHotel.price || 750);
  const distanceKm = nearestHotel.distanceKm !== undefined ? nearestHotel.distanceKm : 0.18;

  const guestName = instance.customer?.name || 'Divakaran';
  const guestEmail = instance.customer?.email || 'divakaranperumal27@gmail.com';
  const bookingId = params.bookingId || sagaState.worldState.hotel?.activeBookingId || 'HTL-CHN-4491';
  const ticketId = params.ticketId || sagaState.worldState.hotel?.ticketId || 'TKT-HTL-8821';
  const roomId = params.roomId || sagaState.worldState.hotel?.roomId || 'ROOM-CHN-4491';

  // Live dynamic available rooms from runtime world state
  const liveAvailableRooms = sagaState.worldState.hotel?.availableRooms !== undefined
    ? sagaState.worldState.hotel.availableRooms
    : nearestHotel.availableRooms;

  // Saga State flags
  const currentStep = sagaState.currentStepIndex;
  const isCrashed = sagaState.isSimulatedCrash || sagaState.status === 'CRASHED';
  const isFailed = sagaState.status === 'FAILED' || sagaState.status === 'PARTIALLY_RECOVERED';
  const isCompensating = sagaState.status === 'COMPENSATING';
  const isRestored = sagaState.status === 'RECOVERED' || sagaState.isWorldRestored;
  const isCompleted = sagaState.status === 'COMPLETED';
  const isRunning = sagaState.status === 'RUNNING';

  // Compute dynamic badge status
  let badgeLabel = 'NEAREST HOTEL DISCOVERED';
  let badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400';
  let paymentStatus = 'NOT_CHARGED';

  if (isRestored) {
    badgeLabel = 'WORLD RESTORED ✓ (INVENTORY FREED)';
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400';
    paymentStatus = sagaState.worldState.payment.refundedAmount > 0
      ? `REFUNDED ₹${sagaState.worldState.payment.refundedAmount.toLocaleString('en-IN')}`
      : 'NOT_CHARGED (₹0 CHARGED)';
  } else if (isCompensating) {
    badgeLabel = 'ROLLING BACK (TOPOLOGICAL UNDO)';
    badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-400 animate-pulse';
    paymentStatus = sagaState.worldState.payment.amountCharged > 0 ? 'REFUND IN PROGRESS' : 'ROLLING BACK HOLDS';
  } else if (isFailed) {
    badgeLabel = 'WORKFLOW FAULT (AWAITING COMPENSATION)';
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400';
    paymentStatus = 'HELD / FAULT';
  } else if (isCrashed) {
    badgeLabel = 'AGENT CRASHED (CHECKPOINT SAVED)';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400';
    paymentStatus = 'SAVED TO DURABLE LOG';
  } else if (isCompleted) {
    badgeLabel = 'RESERVATION COMPLETE & VOUCHER ISSUED';
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400';
    paymentStatus = `PAID ₹${roomPrice.toLocaleString('en-IN')}`;
  } else if (isRunning) {
    if (currentStep === 0) {
      badgeLabel = 'SCANNING 42 HOTELS VIA HAVERSINE';
      badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-400 animate-pulse';
      paymentStatus = 'NOT_CHARGED';
    } else if (currentStep === 1) {
      badgeLabel = `AUTO-SELECTED: ${selectedHotelName} (${distanceKm} km)`;
      badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400';
      paymentStatus = 'NOT_CHARGED';
    } else if (currentStep === 2) {
      badgeLabel = 'ROOM HOLD PLACED (INVENTORY COMMITTED)';
      badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-400 animate-pulse';
      paymentStatus = 'NOT_CHARGED';
    } else if (currentStep === 3) {
      badgeLabel = `CHARGING CARD ₹${roomPrice.toLocaleString('en-IN')}`;
      badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-400 animate-pulse';
      paymentStatus = `CHARGED ₹${roomPrice.toLocaleString('en-IN')}`;
    } else if (currentStep === 4) {
      badgeLabel = 'BOOKING TICKET VOUCHER CREATED';
      badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-400';
      paymentStatus = `CHARGED ₹${roomPrice.toLocaleString('en-IN')}`;
    } else {
      badgeLabel = 'SENDING CONFIRMATION EMAIL VIA RESEND';
      badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400 animate-pulse';
      paymentStatus = `PAID ₹${roomPrice.toLocaleString('en-IN')}`;
    }
  }

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const customerLat = discovery.customerCoord.lat;
    const customerLng = discovery.customerCoord.lng;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [customerLat, customerLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Free OpenStreetMap Tile Provider (Zero API Key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      hotelMarkersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const group = hotelMarkersGroupRef.current;
    if (!map || !group) return;

    // Clear previous markers
    group.clearLayers();
    if (connectionLineRef.current) {
      map.removeLayer(connectionLineRef.current);
      connectionLineRef.current = null;
    }

    // 1. Render Customer / Search Location Marker 📍
    const customerIcon = L.divIcon({
      className: 'custom-customer-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #ef4444;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
          font-size: 18px;
          color: white;
          animation: pulse 2s infinite;
        ">
          📍
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const custMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
      .bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #b91c1c; margin-bottom: 2px;">
            📍 Customer Search Origin
          </div>
          <div style="font-size: 12px; color: #334155;">
            ${discovery.customerCoord.name}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Lat: ${customerLat}, Lng: ${customerLng}
          </div>
        </div>
      `)
      .addTo(group);

    // 2. Render ALL 42 Chennai Hotels
    const bounds = L.latLngBounds([[customerLat, customerLng], [customerLat, customerLng]]);

    discovery.allHotelsWithDistance.forEach((hotel) => {
      const isSelected = hotel.hotelId === nearestHotel.hotelId || hotel.name === selectedHotelName;
      const isSoldOut = hotel.availableRooms === 0;

      bounds.extend([hotel.lat, hotel.lng]);

      let markerBg = isSoldOut ? '#94a3b8' : '#3b82f6';
      let iconHtml = '🏨';
      let markerSize = 28;

      if (isSelected) {
        markerSize = 42;
        if (isRestored) {
          markerBg = '#10b981';
          iconHtml = '✓';
        } else if (isCompensating) {
          markerBg = '#8b5cf6';
          iconHtml = '↺';
        } else if (isFailed) {
          markerBg = '#ef4444';
          iconHtml = '⚠️';
        } else if (isCrashed) {
          markerBg = '#f59e0b';
          iconHtml = '⚡';
        } else if (isCompleted) {
          markerBg = '#10b981';
          iconHtml = '🏨';
        } else {
          markerBg = '#f97316'; // Selected Orange
          iconHtml = '🟠';
        }
      }

      const hotelIcon = L.divIcon({
        className: 'custom-hotel-map-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${markerSize}px;
            height: ${markerSize}px;
            background: ${markerBg};
            border-radius: 50%;
            border: ${isSelected ? '3px solid white' : '2px solid white'};
            box-shadow: ${isSelected ? '0 4px 16px rgba(249, 115, 22, 0.5)' : '0 2px 6px rgba(0,0,0,0.2)'};
            font-size: ${isSelected ? '18px' : '12px'};
            color: white;
            transition: all 0.3s ease;
          ">
            ${iconHtml}
          </div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const hotelMarker = L.marker([hotel.lat, hotel.lng], { icon: hotelIcon }).addTo(group);

      const statusTag = isSelected
        ? `<span style="background: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">⭐ NEAREST AVAILABLE (${hotel.distanceKm} km)</span>`
        : isSoldOut
        ? `<span style="background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">❌ SOLD OUT</span>`
        : `<span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">✓ ${hotel.availableRooms} rooms available</span>`;

      hotelMarker.bindPopup(`
        <div style="font-family: inherit; min-width: 200px; padding: 4px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${hotel.hotelName}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
            📍 ${hotel.area} • 📏 ${hotel.distanceKm} km from search
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #0284c7; margin-bottom: 6px;">
            ${hotel.roomType} • ₹${hotel.price.toLocaleString('en-IN')}/night
          </div>
          <div>${statusTag}</div>
        </div>
      `);

      if (isSelected) {
        hotelMarker.openPopup();
      }
    });

    // 3. Draw connecting line between Customer and Selected Nearest Hotel
    const line = L.polyline(
      [
        [customerLat, customerLng],
        [nearestHotel.lat, nearestHotel.lng],
      ],
      {
        color: '#f97316',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85,
      }
    ).addTo(map);

    connectionLineRef.current = line;

    // Fit map bounds to encompass customer and nearby hotels
    map.fitBounds(
      L.latLngBounds([
        [customerLat - 0.02, customerLng - 0.02],
        [customerLat + 0.02, customerLng + 0.02],
      ])
    );
  }, [
    discovery,
    nearestHotel,
    selectedHotelName,
    isRestored,
    isCompensating,
    isFailed,
    isCrashed,
    isCompleted,
    isRunning,
  ]);

  // Clean unmount of Leaflet
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6 transition-colors">
      {/* Header Banner */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-orange-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-orange-950/10 dark:to-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 dark:bg-orange-500 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Chennai Hotel Discovery & Automated Nearest Selection Engine
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 uppercase tracking-wider">
                Haversine Spatial Algorithm
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>📍 Origin: {discovery.customerCoord.name}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {discovery.totalFound} Hotels Loaded ({discovery.availableFound} Available)
              </span>
              <span>•</span>
              <span>Deterministic Order</span>
            </p>
          </div>
        </div>

        {/* Dynamic Saga Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
            {isRestored && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            {isCompensating && <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />}
            {isFailed && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
            {isRunning && <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />}
            <span>{badgeLabel}</span>
          </div>
        </div>
      </div>

      {/* Discovery Summary Matrix Bar */}
      <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Search Origin</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{discovery.customerCoord.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Hotels Scanned</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">{discovery.totalFound} Properties in Chennai</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Availability Filter</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400">{discovery.availableFound} Available ({discovery.totalFound - discovery.availableFound} Sold Out)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-orange-500 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Nearest Selected</div>
            <div className="font-bold text-orange-600 dark:text-orange-400 truncate">{nearestHotel.hotelName} ({distanceKm} km)</div>
          </div>
        </div>
      </div>

      {/* Map Container + Discovery / Telemetry Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* Leaflet Map Visualizer (7 cols) */}
        <div className="lg:col-span-7 relative bg-slate-100 dark:bg-slate-950 min-h-[380px] lg:min-h-[440px]">
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[380px] lg:min-h-[440px] z-0"
            style={{ minHeight: '440px' }}
          />

          {/* Floating Distance HUD Badge */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-md text-xs z-[400] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Distance Vector:</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{distanceKm} km</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Haversine Calculated</span>
          </div>

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-md text-[11px] text-slate-700 dark:text-slate-300 z-[400] space-y-1.5 max-w-[240px]">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Map Markers & Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">📍</span>
              <span>Customer Search Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">Nearest Available Hotel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
              <span>Other Available Hotels ({discovery.availableFound - 1})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></span>
              <span className="text-slate-400">Sold Out Hotels (0 Rooms)</span>
            </div>
          </div>
        </div>

        {/* Discovery & Hotel Telemetry Sidebar (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-slate-50/70 dark:bg-slate-900/70 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Auto Selected Hotel Card */}
            <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border-2 border-orange-400 dark:border-orange-500/80 shadow-md space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-bl-lg text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                AUTOMATICALLY SELECTED
              </div>

              <div>
                <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-0.5">
                  NEAREST AVAILABLE PROPERTY ({distanceKm} KM)
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-1.5">
                  <span>{selectedHotelName}</span>
                  <span className="flex items-center text-amber-500 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 inline ml-1" /> {nearestHotel.rating}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{nearestHotel.address}</span>
                </p>
              </div>

              {/* Room & Unit Metadata */}
              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Room Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {roomType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Available Units</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {liveAvailableRooms} Rooms
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tariff</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{roomPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sorted Top 3 Nearest Hotels List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ranked Nearest Available Hotels</span>
                </span>
                <span className="text-[10px] text-slate-400">Haversine Sorted</span>
              </div>

              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {discovery.availableHotelsSorted.slice(0, 3).map((hotel, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={hotel.hotelId}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isTop
                          ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isTop ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {hotel.hotelName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {hotel.area} • {hotel.roomType}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {hotel.distanceKm} km
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          ₹{hotel.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Saga Telemetry Mini Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Voucher Ticket */}
              <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                  <Ticket className="w-3 h-3 text-emerald-500" />
                  <span>Voucher Ticket</span>
                </div>
                <div className="font-bold font-mono text-slate-800 dark:text-slate-200 text-xs truncate">
                  {currentStep >= 4 || isCompleted ? ticketId : 'UNISSUED'}
                </div>
                <div className="text-[9px] text-slate-500">
                  {isRestored ? 'CANCELLED / VOID' : currentStep >= 4 || isCompleted ? 'CONFIRMED' : 'AWAITING STEP 5'}
                </div>
              </div>

              {/* Payment Ledger */}
              <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                  <CreditCard className="w-3 h-3 text-amber-500" />
                  <span>Payment Ledger</span>
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                  {paymentStatus}
                </div>
                <div className="text-[9px] text-slate-500">
                  {isRestored
                    ? (sagaState.worldState.payment.refundedAmount > 0 ? 'REVERSE REFUND COMMITTED' : 'CARD NOT CHARGED')
                    : currentStep >= 3 || isCompleted ? 'SETTLED' : 'READY'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Undo Guarantee Alert */}
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-emerald-900 dark:text-emerald-300 font-medium">
                {isRestored
                  ? (sagaState.worldState.payment.refundedAmount > 0
                    ? `Compensation verified: Room hold at ${selectedHotelName} cancelled, ₹${sagaState.worldState.payment.refundedAmount.toLocaleString('en-IN')} refunded, and room availability restored to ${liveAvailableRooms}.`
                    : `Compensation verified: Room hold at ${selectedHotelName} cancelled, room availability restored to ${liveAvailableRooms}, card was not charged.`)
                  : 'Saga Compensable: Room hold, ticket voucher, and tariff automatically revert on UNDO.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
