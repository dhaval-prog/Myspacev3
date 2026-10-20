// Mapbox public token (same as Myspace v2). Public `pk.` tokens are meant to ship in client code;
// restrict allowed URLs on the token in the Mapbox account. EXPO_PUBLIC_MAPBOX_TOKEN overrides it.
export const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  'pk.eyJ1IjoiZGhhdmFsZGFtYW5pYTA0MTEyMDI1IiwiYSI6ImNtdWhqemE1YjA3Y2oyd3M5eGRkOW43MHAifQ.9-ZLwXHOH_T-pfMcRIsH-w';
