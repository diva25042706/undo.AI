// ============================================================================
// UNDO.AI — CHENNAI GEO COORDINATES & SYNTHETIC HOTEL DISCOVERY ENGINE
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// (Synthetic / Demo Coordinates & Dynamic Spatial Haversine Distance Engine)
// ============================================================================

export interface GeoCoordinate {
  lat: number;
  lng: number;
  name: string;
}

export const CHENNAI_GEO_REGISTRY: Record<string, GeoCoordinate> = {
  thiruvanmiyur: { lat: 13.0108, lng: 80.2668, name: 'Thiruvanmiyur' },
  sholinganallur: { lat: 12.9010, lng: 80.2279, name: 'Sholinganallur' },
  omr: { lat: 12.9352, lng: 80.2312, name: 'OMR (IT Expressway)' },
  driver_base: { lat: 13.0000, lng: 80.2500, name: 'Driver Starting Base' },
  perungudi: { lat: 12.9654, lng: 80.2461, name: 'Perungudi' },
  thoraipakkam: { lat: 12.9352, lng: 80.2312, name: 'Thoraipakkam' },
  adyar: { lat: 13.0012, lng: 80.2565, name: 'Adyar' },
  besant_nagar: { lat: 13.0001, lng: 80.2667, name: 'Besant Nagar' },
  velachery: { lat: 12.9759, lng: 80.2212, name: 'Velachery' },
  guindy: { lat: 13.0067, lng: 80.2026, name: 'Guindy' },
  nungambakkam: { lat: 13.0569, lng: 80.2425, name: 'Nungambakkam' },
  t_nagar: { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
  anna_nagar: { lat: 13.0850, lng: 80.2101, name: 'Anna Nagar' },
  mylapore: { lat: 13.0368, lng: 80.2676, name: 'Mylapore' },
  egmore: { lat: 13.0827, lng: 80.2707, name: 'Egmore' },
  navalur: { lat: 12.8458, lng: 80.2268, name: 'Navalur' },
  porur: { lat: 13.0382, lng: 80.1565, name: 'Porur' },
  tambaram: { lat: 12.9249, lng: 80.1000, name: 'Tambaram' },
  royapettah: { lat: 13.0528, lng: 80.2604, name: 'Royapettah' },
  kilpauk: { lat: 13.0784, lng: 80.2435, name: 'Kilpauk' },
  chetpet: { lat: 13.0694, lng: 80.2386, name: 'Chetpet' },
  saidapet: { lat: 13.0213, lng: 80.2231, name: 'Saidapet' },
  koyambedu: { lat: 13.0692, lng: 80.1948, name: 'Koyambedu' },
  mogappair: { lat: 13.0838, lng: 80.1748, name: 'Mogappair' },
  ambattur: { lat: 13.1143, lng: 80.1481, name: 'Ambattur' },
  avadi: { lat: 13.1147, lng: 80.1008, name: 'Avadi' },
  pallavaram: { lat: 12.9675, lng: 80.1491, name: 'Pallavaram' },
  chromepet: { lat: 12.9516, lng: 80.1462, name: 'Chromepet' },
  pammal: { lat: 12.9688, lng: 80.1332, name: 'Pammal' },
  medavakkam: { lat: 12.9193, lng: 80.1878, name: 'Medavakkam' },
  pallikaranai: { lat: 12.9366, lng: 80.2088, name: 'Pallikaranai' },
};

export const DEFAULT_CUSTOMER_LOCATION: GeoCoordinate = {
  lat: 13.0569,
  lng: 80.2425,
  name: 'Nungambakkam, Chennai',
};

export interface ChennaiHotelLocation {
  hotelId: string;
  id: string; // alias for compatibility
  hotelName: string;
  name: string; // alias
  area: string;
  roomTypes: string[];
  roomType: string;
  price: number;
  availableRooms: number;
  lat: number;
  lng: number;
  latitude: number; // alias
  longitude: number; // alias
  rating: number;
  address: string;
  distanceKm?: number;
}

/**
 * Haversine formula to compute great-circle distance between two coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(2));
}

/**
 * Extensive Chennai Hotel Inventory (42 Distributed Synthetic Properties)
 */
export const CHENNAI_HOTELS: ChennaiHotelLocation[] = [
  // --- Nungambakkam Corridor ---
  {
    hotelId: 'HTL-CHN-001',
    id: 'HTL-CHN-001',
    hotelName: 'Nungambakkam Heritage Inn',
    name: 'Nungambakkam Heritage Inn',
    area: 'Nungambakkam',
    roomTypes: ['Standard Room', 'Deluxe Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 0, // SOLD OUT (0.10 km) to test availability filter
    lat: 13.0575,
    lng: 80.2431,
    latitude: 13.0575,
    longitude: 80.2431,
    rating: 4.1,
    address: 'Valluvar Kottam High Rd, Nungambakkam, Chennai 600034',
  },
  {
    hotelId: 'HTL-CHN-002',
    id: 'HTL-CHN-002',
    hotelName: 'Pharos Hotels',
    name: 'Pharos Hotels',
    area: 'Nungambakkam',
    roomTypes: ['Deluxe Room', 'Executive Suite'],
    roomType: 'Deluxe Room',
    price: 750, // ₹750 standard hotel workflow price
    availableRooms: 3, // NEAREST AVAILABLE (0.18 km) to default customer location
    lat: 13.0583,
    lng: 80.2435,
    latitude: 13.0583,
    longitude: 80.2435,
    rating: 4.6,
    address: 'Sterling Road, Nungambakkam, Chennai 600034',
  },
  {
    hotelId: 'HTL-CHN-003',
    id: 'HTL-CHN-003',
    hotelName: 'Park Avenue Hotel',
    name: 'Park Avenue Hotel',
    area: 'Nungambakkam',
    roomTypes: ['Executive Room', 'Standard Room'],
    roomType: 'Executive Room',
    price: 750,
    availableRooms: 2,
    lat: 13.0590,
    lng: 80.2440,
    latitude: 13.0590,
    longitude: 80.2440,
    rating: 4.3,
    address: 'Nungambakkam High Road, Chennai 600034',
  },
  {
    hotelId: 'HTL-CHN-004',
    id: 'HTL-CHN-004',
    hotelName: 'Taj Coromandel',
    name: 'Taj Coromandel',
    area: 'Nungambakkam',
    roomTypes: ['Luxury Suite', 'Club Room'],
    roomType: 'Luxury Suite',
    price: 750,
    availableRooms: 3,
    lat: 13.0602,
    lng: 80.2467,
    latitude: 13.0602,
    longitude: 80.2467,
    rating: 4.8,
    address: 'Mahatma Gandhi Road, Nungambakkam, Chennai 600034',
  },
  {
    hotelId: 'HTL-CHN-005',
    id: 'HTL-CHN-005',
    hotelName: 'UPAR Hotels Nungambakkam',
    name: 'UPAR Hotels Nungambakkam',
    area: 'Nungambakkam',
    roomTypes: ['Standard Room', 'Deluxe Room'],
    roomType: 'Standard Room',
    price: 750,
    availableRooms: 4,
    lat: 13.0640,
    lng: 80.2390,
    latitude: 13.0640,
    longitude: 80.2390,
    rating: 4.2,
    address: 'College Road, Nungambakkam, Chennai 600006',
  },

  // --- T. Nagar / Chetpet / Kilpauk ---
  {
    hotelId: 'HTL-CHN-006',
    id: 'HTL-CHN-006',
    hotelName: 'The Residency Towers',
    name: 'The Residency Towers',
    area: 'T. Nagar',
    roomTypes: ['Executive Room', 'Deluxe Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 5,
    lat: 13.0418,
    lng: 80.2341,
    latitude: 13.0418,
    longitude: 80.2341,
    rating: 4.5,
    address: 'Sir Thyagaraya Road, T. Nagar, Chennai 600017',
  },
  {
    hotelId: 'HTL-CHN-007',
    id: 'HTL-CHN-007',
    hotelName: 'Grand Chennai by GRT',
    name: 'Grand Chennai by GRT',
    area: 'T. Nagar',
    roomTypes: ['Grand Club', 'Deluxe Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 2,
    lat: 13.0440,
    lng: 80.2380,
    latitude: 13.0440,
    longitude: 80.2380,
    rating: 4.7,
    address: 'Sir Thyagaraya Rd, T. Nagar, Chennai 600017',
  },
  {
    hotelId: 'HTL-CHN-008',
    id: 'HTL-CHN-008',
    hotelName: 'Accord Metropolitan',
    name: 'Accord Metropolitan',
    area: 'T. Nagar',
    roomTypes: ['Superior Room', 'Studio Suite'],
    roomType: 'Superior Room',
    price: 750,
    availableRooms: 0, // SOLD OUT
    lat: 13.0480,
    lng: 80.2410,
    latitude: 13.0480,
    longitude: 80.2410,
    rating: 4.4,
    address: 'Gopathi Narayanaswami Chetty Rd, T. Nagar, Chennai 600017',
  },
  {
    hotelId: 'HTL-CHN-009',
    id: 'HTL-CHN-009',
    hotelName: 'Chetpet Eco Stay',
    name: 'Chetpet Eco Stay',
    area: 'Chetpet',
    roomTypes: ['Deluxe Garden View', 'Standard Room'],
    roomType: 'Deluxe Garden View',
    price: 750,
    availableRooms: 3,
    lat: 13.0694,
    lng: 80.2386,
    latitude: 13.0694,
    longitude: 80.2386,
    rating: 4.3,
    address: 'Harrington Road, Chetpet, Chennai 600031',
  },
  {
    hotelId: 'HTL-CHN-010',
    id: 'HTL-CHN-010',
    hotelName: 'Ega Residency Kilpauk',
    name: 'Ega Residency Kilpauk',
    area: 'Kilpauk',
    roomTypes: ['Standard AC', 'Deluxe AC'],
    roomType: 'Deluxe AC',
    price: 750,
    availableRooms: 4,
    lat: 13.0784,
    lng: 80.2435,
    latitude: 13.0784,
    longitude: 80.2435,
    rating: 4.2,
    address: 'Poonamallee High Road, Kilpauk, Chennai 600010',
  },

  // --- Egmore / Royapettah / Mylapore ---
  {
    hotelId: 'HTL-CHN-011',
    id: 'HTL-CHN-011',
    hotelName: 'Ramada Plaza Egmore',
    name: 'Ramada Plaza Egmore',
    area: 'Egmore',
    roomTypes: ['Executive Room', 'Plaza Suite'],
    roomType: 'Executive Room',
    price: 750,
    availableRooms: 2,
    lat: 13.0827,
    lng: 80.2707,
    latitude: 13.0827,
    longitude: 80.2707,
    rating: 4.4,
    address: 'Gandhi Irwin Road, Egmore, Chennai 600008',
  },
  {
    hotelId: 'HTL-CHN-012',
    id: 'HTL-CHN-012',
    hotelName: 'Taj Connemara',
    name: 'Taj Connemara',
    area: 'Royapettah',
    roomTypes: ['Heritage Room', 'Colonial Suite'],
    roomType: 'Heritage Room',
    price: 750,
    availableRooms: 1,
    lat: 13.0598,
    lng: 80.2604,
    latitude: 13.0598,
    longitude: 80.2604,
    rating: 4.8,
    address: 'Binny Road, Royapettah, Chennai 600002',
  },
  {
    hotelId: 'HTL-CHN-013',
    id: 'HTL-CHN-013',
    hotelName: 'Clarion Hotel President',
    name: 'Clarion Hotel President',
    area: 'Mylapore',
    roomTypes: ['Deluxe Ocean', 'Standard Club'],
    roomType: 'Deluxe Ocean',
    price: 750,
    availableRooms: 6,
    lat: 13.0368,
    lng: 80.2676,
    latitude: 13.0368,
    longitude: 80.2676,
    rating: 4.3,
    address: 'Dr. Radhakrishnan Salai, Mylapore, Chennai 600004',
  },
  {
    hotelId: 'HTL-CHN-014',
    id: 'HTL-CHN-014',
    hotelName: 'Savera Hotel',
    name: 'Savera Hotel',
    area: 'Royapettah',
    roomTypes: ['Executive Room', 'Club Deluxe'],
    roomType: 'Executive Room',
    price: 750,
    availableRooms: 0, // SOLD OUT
    lat: 13.0489,
    lng: 80.2580,
    latitude: 13.0489,
    longitude: 80.2580,
    rating: 4.4,
    address: 'Dr Radhakrishnan Salai, Royapettah, Chennai 600004',
  },
  {
    hotelId: 'HTL-CHN-015',
    id: 'HTL-CHN-015',
    hotelName: 'New Woodlands Hotel',
    name: 'New Woodlands Hotel',
    area: 'Mylapore',
    roomTypes: ['Comfort Room', 'Family Suite'],
    roomType: 'Comfort Room',
    price: 750,
    availableRooms: 5,
    lat: 13.0450,
    lng: 80.2590,
    latitude: 13.0450,
    longitude: 80.2590,
    rating: 4.2,
    address: 'Dr. Radhakrishnan Road, Mylapore, Chennai 600004',
  },

  // --- Anna Nagar / Mogappair / Koyambedu ---
  {
    hotelId: 'HTL-CHN-016',
    id: 'HTL-CHN-016',
    hotelName: 'Radisson Blu Anna Nagar',
    name: 'Radisson Blu Anna Nagar',
    area: 'Anna Nagar',
    roomTypes: ['Superior Room', 'Business Class'],
    roomType: 'Superior Room',
    price: 750,
    availableRooms: 3,
    lat: 13.0850,
    lng: 80.2101,
    latitude: 13.0850,
    longitude: 80.2101,
    rating: 4.6,
    address: '2nd Avenue, Anna Nagar East, Chennai 600102',
  },
  {
    hotelId: 'HTL-CHN-017',
    id: 'HTL-CHN-017',
    hotelName: 'Koyambedu Gateway Inn',
    name: 'Koyambedu Gateway Inn',
    area: 'Koyambedu',
    roomTypes: ['Standard AC', 'Deluxe AC'],
    roomType: 'Standard AC',
    price: 750,
    availableRooms: 8,
    lat: 13.0692,
    lng: 80.1948,
    latitude: 13.0692,
    longitude: 80.1948,
    rating: 4.0,
    address: 'Jawaharlal Nehru Road, Koyambedu, Chennai 600107',
  },
  {
    hotelId: 'HTL-CHN-018',
    id: 'HTL-CHN-018',
    hotelName: 'Mogappair Grand Suites',
    name: 'Mogappair Grand Suites',
    area: 'Mogappair',
    roomTypes: ['Deluxe Room', 'Studio'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 4,
    lat: 13.0838,
    lng: 80.1748,
    latitude: 13.0838,
    longitude: 80.1748,
    rating: 4.1,
    address: 'Mogappair West Main Rd, Chennai 600037',
  },

  // --- Guindy / Saidapet / Porur ---
  {
    hotelId: 'HTL-CHN-019',
    id: 'HTL-CHN-019',
    hotelName: 'ITC Grand Chola',
    name: 'ITC Grand Chola',
    area: 'Guindy',
    roomTypes: ['Executive Club', 'ITC One Suite'],
    roomType: 'Executive Club',
    price: 750,
    availableRooms: 4,
    lat: 13.0067,
    lng: 80.2026,
    latitude: 13.0067,
    longitude: 80.2026,
    rating: 4.9,
    address: 'Mount Road, Guindy, Chennai 600032',
  },
  {
    hotelId: 'HTL-CHN-020',
    id: 'HTL-CHN-020',
    hotelName: 'Hilton Chennai',
    name: 'Hilton Chennai',
    area: 'Guindy',
    roomTypes: ['King Deluxe', 'Executive Room'],
    roomType: 'King Deluxe',
    price: 750,
    availableRooms: 2,
    lat: 13.0102,
    lng: 80.2065,
    latitude: 13.0102,
    longitude: 80.2065,
    rating: 4.7,
    address: 'Jawaharlal Nehru Road, Guindy, Chennai 600032',
  },
  {
    hotelId: 'HTL-CHN-021',
    id: 'HTL-CHN-021',
    hotelName: 'Saidapet Metro Comforts',
    name: 'Saidapet Metro Comforts',
    area: 'Saidapet',
    roomTypes: ['Budget AC', 'Deluxe Room'],
    roomType: 'Budget AC',
    price: 750,
    availableRooms: 5,
    lat: 13.0213,
    lng: 80.2231,
    latitude: 13.0213,
    longitude: 80.2231,
    rating: 3.9,
    address: 'Anna Salai, Saidapet, Chennai 600015',
  },
  {
    hotelId: 'HTL-CHN-022',
    id: 'HTL-CHN-022',
    hotelName: 'Feathers A Radha Hotel',
    name: 'Feathers A Radha Hotel',
    area: 'Porur',
    roomTypes: ['Deluxe Room', 'Radha Suite'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 3,
    lat: 13.0382,
    lng: 80.1565,
    latitude: 13.0382,
    longitude: 80.1565,
    rating: 4.6,
    address: 'Mount Poonamallee High Rd, Porur, Chennai 600125',
  },

  // --- Adyar / Besant Nagar / Thiruvanmiyur ---
  {
    hotelId: 'HTL-CHN-023',
    id: 'HTL-CHN-023',
    hotelName: 'The Leela Palace',
    name: 'The Leela Palace',
    area: 'Adyar',
    roomTypes: ['Grand Deluxe Sea View', 'Presidential Suite'],
    roomType: 'Grand Deluxe Sea View',
    price: 750,
    availableRooms: 2,
    lat: 13.0162,
    lng: 80.2785,
    latitude: 13.0162,
    longitude: 80.2785,
    rating: 4.9,
    address: 'Adyar Seaface, MRC Nagar, Chennai 600028',
  },
  {
    hotelId: 'HTL-CHN-024',
    id: 'HTL-CHN-024',
    hotelName: 'Park Hyatt Chennai',
    name: 'Park Hyatt Chennai',
    area: 'Guindy / Adyar',
    roomTypes: ['Park King Room', 'Park Suite'],
    roomType: 'Park King Room',
    price: 750,
    availableRooms: 3,
    lat: 13.0115,
    lng: 80.2210,
    latitude: 13.0115,
    longitude: 80.2210,
    rating: 4.7,
    address: 'Velachery Road, Near Raj Bhavan, Chennai 600032',
  },
  {
    hotelId: 'HTL-CHN-025',
    id: 'HTL-CHN-025',
    hotelName: 'Besant Nagar Coastal Stay',
    name: 'Besant Nagar Coastal Stay',
    area: 'Besant Nagar',
    roomTypes: ['Beachview Standard', 'Deluxe AC'],
    roomType: 'Beachview Standard',
    price: 750,
    availableRooms: 0, // SOLD OUT
    lat: 13.0001,
    lng: 80.2667,
    latitude: 13.0001,
    longitude: 80.2667,
    rating: 4.2,
    address: '6th Avenue, Elliot Beach, Besant Nagar, Chennai 600090',
  },
  {
    hotelId: 'HTL-CHN-026',
    id: 'HTL-CHN-026',
    hotelName: 'Ginger Hotel Chennai',
    name: 'Ginger Hotel Chennai',
    area: 'Thiruvanmiyur',
    roomTypes: ['Luxe Room', 'Standard Room'],
    roomType: 'Standard Room',
    price: 750,
    availableRooms: 6,
    lat: 13.0108,
    lng: 80.2668,
    latitude: 13.0108,
    longitude: 80.2668,
    rating: 4.1,
    address: 'IITM Research Park, Taramani / Thiruvanmiyur, Chennai 600113',
  },

  // --- Velachery / Perungudi / Thoraipakkam / OMR ---
  {
    hotelId: 'HTL-CHN-027',
    id: 'HTL-CHN-027',
    hotelName: 'The Westin Chennai Velachery',
    name: 'The Westin Chennai Velachery',
    area: 'Velachery',
    roomTypes: ['Heavenly Deluxe', 'Executive Suite'],
    roomType: 'Heavenly Deluxe',
    price: 750,
    availableRooms: 4,
    lat: 12.9759,
    lng: 80.2212,
    latitude: 12.9759,
    longitude: 80.2212,
    rating: 4.7,
    address: 'Velachery Main Road, Velachery, Chennai 600042',
  },
  {
    hotelId: 'HTL-CHN-028',
    id: 'HTL-CHN-028',
    hotelName: 'Holiday Inn Express OMR',
    name: 'Holiday Inn Express OMR',
    area: 'Perungudi',
    roomTypes: ['Standard Queen', 'Twin Room'],
    roomType: 'Standard Queen',
    price: 750,
    availableRooms: 5,
    lat: 12.9654,
    lng: 80.2461,
    latitude: 12.9654,
    longitude: 80.2461,
    rating: 4.3,
    address: 'Old Mahabalipuram Rd, Perungudi, Chennai 600096',
  },
  {
    hotelId: 'HTL-CHN-029',
    id: 'HTL-CHN-029',
    hotelName: 'Novotel Chennai OMR',
    name: 'Novotel Chennai OMR',
    area: 'Thoraipakkam',
    roomTypes: ['Superior King', 'Executive Suite'],
    roomType: 'Superior King',
    price: 750,
    availableRooms: 2,
    lat: 12.9352,
    lng: 80.2312,
    latitude: 12.9352,
    longitude: 80.2312,
    rating: 4.5,
    address: 'IT Expressway, Thoraipakkam, Chennai 600097',
  },
  {
    hotelId: 'HTL-CHN-030',
    id: 'HTL-CHN-030',
    hotelName: 'Aloft Chennai OMR',
    name: 'Aloft Chennai OMR',
    area: 'Sholinganallur',
    roomTypes: ['Aloft Room', 'Savvy Suite'],
    roomType: 'Aloft Room',
    price: 750,
    availableRooms: 7,
    lat: 12.9010,
    lng: 80.2279,
    latitude: 12.9010,
    longitude: 80.2279,
    rating: 4.4,
    address: 'Rajiv Gandhi Salai, Sholinganallur, Chennai 600119',
  },

  // --- Pallavaram / Tambaram / Chromepet / Pammal ---
  {
    hotelId: 'HTL-CHN-031',
    id: 'HTL-CHN-031',
    hotelName: 'Radisson Blu Hotel GRT Airport',
    name: 'Radisson Blu Hotel GRT Airport',
    area: 'Pallavaram',
    roomTypes: ['Deluxe Room', 'Business Class'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 3,
    lat: 12.9675,
    lng: 80.1491,
    latitude: 12.9675,
    longitude: 80.1491,
    rating: 4.6,
    address: 'GST Road, St. Thomas Mount / Pallavaram, Chennai 600027',
  },
  {
    hotelId: 'HTL-CHN-032',
    id: 'HTL-CHN-032',
    hotelName: 'Grand Palace Hotel Chromepet',
    name: 'Grand Palace Hotel Chromepet',
    area: 'Chromepet',
    roomTypes: ['Executive AC', 'Deluxe Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 4,
    lat: 12.9516,
    lng: 80.1462,
    latitude: 12.9516,
    longitude: 80.1462,
    rating: 4.1,
    address: 'GST Road, Chromepet, Chennai 600044',
  },
  {
    hotelId: 'HTL-CHN-033',
    id: 'HTL-CHN-033',
    hotelName: 'Pammal Airport Residency',
    name: 'Pammal Airport Residency',
    area: 'Pammal',
    roomTypes: ['Standard AC', 'Budget Double'],
    roomType: 'Standard AC',
    price: 750,
    availableRooms: 6,
    lat: 12.9688,
    lng: 80.1332,
    latitude: 12.9688,
    longitude: 80.1332,
    rating: 3.8,
    address: 'Pammal Main Road, Chennai 600075',
  },
  {
    hotelId: 'HTL-CHN-034',
    id: 'HTL-CHN-034',
    hotelName: 'Tambaram Highway Comforts',
    name: 'Tambaram Highway Comforts',
    area: 'Tambaram',
    roomTypes: ['Deluxe AC', 'Family Triple'],
    roomType: 'Deluxe AC',
    price: 750,
    availableRooms: 5,
    lat: 12.9249,
    lng: 80.1000,
    latitude: 12.9249,
    longitude: 80.1000,
    rating: 4.0,
    address: 'GST Road, West Tambaram, Chennai 600045',
  },

  // --- Medavakkam / Pallikaranai / Navalur / Ambattur / Avadi ---
  {
    hotelId: 'HTL-CHN-035',
    id: 'HTL-CHN-035',
    hotelName: 'Medavakkam Royal Inn',
    name: 'Medavakkam Royal Inn',
    area: 'Medavakkam',
    roomTypes: ['Standard AC', 'Deluxe Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 4,
    lat: 12.9193,
    lng: 80.1878,
    latitude: 12.9193,
    longitude: 80.1878,
    rating: 4.0,
    address: 'Velachery-Tambaram Main Rd, Medavakkam, Chennai 600100',
  },
  {
    hotelId: 'HTL-CHN-036',
    id: 'HTL-CHN-036',
    hotelName: 'Pallikaranai Marsh View Suites',
    name: 'Pallikaranai Marsh View Suites',
    area: 'Pallikaranai',
    roomTypes: ['Deluxe AC', 'Executive Room'],
    roomType: 'Deluxe AC',
    price: 750,
    availableRooms: 3,
    lat: 12.9366,
    lng: 80.2088,
    latitude: 12.9366,
    longitude: 80.2088,
    rating: 4.2,
    address: '200 Feet Radial Rd, Pallikaranai, Chennai 600100',
  },
  {
    hotelId: 'HTL-CHN-037',
    id: 'HTL-CHN-037',
    hotelName: 'Days Hotel by Wyndham Chennai OMR',
    name: 'Days Hotel by Wyndham Chennai OMR',
    area: 'Navalur',
    roomTypes: ['Superior King', 'Deluxe Twin'],
    roomType: 'Superior King',
    price: 750,
    availableRooms: 4,
    lat: 12.8458,
    lng: 80.2268,
    latitude: 12.8458,
    longitude: 80.2268,
    rating: 4.3,
    address: 'Rajiv Gandhi Salai, Navalur, Chennai 603103',
  },
  {
    hotelId: 'HTL-CHN-038',
    id: 'HTL-CHN-038',
    hotelName: 'Ambattur Industrial Gateway Inn',
    name: 'Ambattur Industrial Gateway Inn',
    area: 'Ambattur',
    roomTypes: ['Executive AC', 'Standard Room'],
    roomType: 'Executive AC',
    price: 750,
    availableRooms: 5,
    lat: 13.1143,
    lng: 80.1481,
    latitude: 13.1143,
    longitude: 80.1481,
    rating: 3.9,
    address: 'MTH Road, Ambattur OT, Chennai 600053',
  },
  {
    hotelId: 'HTL-CHN-039',
    id: 'HTL-CHN-039',
    hotelName: 'Avadi Grand Residency',
    name: 'Avadi Grand Residency',
    area: 'Avadi',
    roomTypes: ['Deluxe AC', 'Standard Non-AC'],
    roomType: 'Deluxe AC',
    price: 750,
    availableRooms: 6,
    lat: 13.1147,
    lng: 80.1008,
    latitude: 13.1147,
    longitude: 80.1008,
    rating: 3.8,
    address: 'Near HVF Main Gate, Avadi, Chennai 600054',
  },
  {
    hotelId: 'HTL-CHN-040',
    id: 'HTL-CHN-040',
    hotelName: 'Courtyard by Marriott Chennai',
    name: 'Courtyard by Marriott Chennai',
    area: 'T. Nagar / Royapettah',
    roomTypes: ['Deluxe King', 'Executive Suite'],
    roomType: 'Deluxe King',
    price: 750,
    availableRooms: 3,
    lat: 13.0485,
    lng: 80.2475,
    latitude: 13.0485,
    longitude: 80.2475,
    rating: 4.6,
    address: '564 Anna Salai, Teynampet, Chennai 600018',
  },
  {
    hotelId: 'HTL-CHN-041',
    id: 'HTL-CHN-041',
    hotelName: 'The Raintree Hotel St. Marys',
    name: 'The Raintree Hotel St. Marys',
    area: 'Alwarpet / Mylapore',
    roomTypes: ['Deluxe Room', 'Club Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 2,
    lat: 13.0335,
    lng: 80.2520,
    latitude: 13.0335,
    longitude: 80.2520,
    rating: 4.7,
    address: 'St Marys Road, Alwarpet, Chennai 600018',
  },
  {
    hotelId: 'HTL-CHN-042',
    id: 'HTL-CHN-042',
    hotelName: 'Feathers Luxury Stay',
    name: 'Feathers Luxury Stay',
    area: 'Porur',
    roomTypes: ['Executive Suite', 'Deluxe Room'],
    roomType: 'Deluxe Room',
    price: 750,
    availableRooms: 4,
    lat: 13.0390,
    lng: 80.1580,
    latitude: 13.0390,
    longitude: 80.1580,
    rating: 4.5,
    address: 'Porur Junction, Chennai 600116',
  },
];

/**
 * Discover, compute Haversine distances, filter available hotels, and select the nearest available hotel.
 */
export function discoverNearestAvailableHotel(
  searchLocation: string = 'Nungambakkam',
  customCoord?: { lat: number; lng: number }
): {
  customerCoord: GeoCoordinate;
  totalFound: number;
  availableFound: number;
  allHotelsWithDistance: ChennaiHotelLocation[];
  availableHotelsSorted: ChennaiHotelLocation[];
  selectedNearestHotel: ChennaiHotelLocation;
} {
  const coord = customCoord
    ? { lat: customCoord.lat, lng: customCoord.lng, name: searchLocation }
    : getCoordinateForLocation(searchLocation);

  const customerCoord: GeoCoordinate = {
    lat: coord.lat,
    lng: coord.lng,
    name: searchLocation.includes('Chennai') ? searchLocation : `${searchLocation}, Chennai`,
  };

  // Compute Haversine distances for all 42 hotels
  const allHotelsWithDistance = CHENNAI_HOTELS.map((hotel) => {
    const dist = calculateHaversineDistanceKm(
      customerCoord.lat,
      customerCoord.lng,
      hotel.lat,
      hotel.lng
    );
    return {
      ...hotel,
      distanceKm: dist,
    };
  });

  // Filter only hotels with availableRooms > 0
  const availableHotels = allHotelsWithDistance.filter((h) => h.availableRooms > 0);

  // Sort ascending by geographic distance
  const availableHotelsSorted = [...availableHotels].sort(
    (a, b) => (a.distanceKm || 0) - (b.distanceKm || 0)
  );

  // Pick the nearest available hotel deterministically
  const selectedNearestHotel = availableHotelsSorted[0] || allHotelsWithDistance[0];

  return {
    customerCoord,
    totalFound: allHotelsWithDistance.length,
    availableFound: availableHotels.length,
    allHotelsWithDistance,
    availableHotelsSorted,
    selectedNearestHotel,
  };
}

export function getCoordinateForLocation(name: string): GeoCoordinate {
  if (!name) return DEFAULT_CUSTOMER_LOCATION;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  for (const [regKey, coord] of Object.entries(CHENNAI_GEO_REGISTRY)) {
    if (key.includes(regKey) || regKey.includes(key)) {
      return coord;
    }
  }
  return DEFAULT_CUSTOMER_LOCATION;
}

/**
 * Generate synthetic realistic waypoint route connecting driver, pickup and destination
 */
export function generateSyntheticRoute(
  driverStartCoord: GeoCoordinate,
  pickupCoord: GeoCoordinate,
  dropCoord: GeoCoordinate,
  stepCount: number = 10
): Array<[number, number]> {
  const points: Array<[number, number]> = [];

  // Segment 1: Driver to Pickup (3 intermediate waypoints)
  const seg1Count = 3;
  for (let i = 0; i <= seg1Count; i++) {
    const fraction = i / seg1Count;
    const lat = driverStartCoord.lat + (pickupCoord.lat - driverStartCoord.lat) * fraction;
    const lng = driverStartCoord.lng + (pickupCoord.lng - driverStartCoord.lng) * fraction;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  // Segment 2: Pickup to Destination (stepCount waypoints with OMR curve)
  for (let i = 1; i <= stepCount; i++) {
    const fraction = i / stepCount;
    const curveOffset = Math.sin(fraction * Math.PI) * 0.0035;
    const lat = pickupCoord.lat + (dropCoord.lat - pickupCoord.lat) * fraction - curveOffset * 0.4;
    const lng = pickupCoord.lng + (dropCoord.lng - pickupCoord.lng) * fraction + curveOffset;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  return points;
}
