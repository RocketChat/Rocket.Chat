// Unified map provider interface + two implementations (Google, OpenStreetMap via LocationIQ)

export type MapProviderName = 'google' | 'openstreetmap';

export interface MapProvider {
  name: MapProviderName;
  // Static preview image for messages / modal
  getStaticMapUrl(lat: number, lng: number, opts?: { zoom?: number; width?: number; height?: number }): string;
  // Deep link that opens the native app or web directions
  getMapsLink(lat: number, lng: number): string;
  // Human-readable attribution (OSM requires)
  getAttribution?: () => string | undefined;
}

type ProviderOpts = {
  googleApiKey?: string;      // required for Google Static Maps
  locationIqKey?: string;     // required for LocationIQ static (OSM-backed)
};

// ------------ Google ------------
export class GoogleProvider implements MapProvider {
  name: MapProviderName = 'google';
  constructor(private opts: ProviderOpts) {}
  getStaticMapUrl(lat: number, lng: number, opts?: { zoom?: number; width?: number; height?: number }): string {
    const key = this.opts.googleApiKey;
    const zoom = opts?.zoom ?? 15;
    const width = opts?.width ?? 600;
    const height = opts?.height ?? 320;
    // NOTE: consider server-side signing if you need URL signing for premium usage.
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng}&key=${key}`;
  }
  getMapsLink(lat: number, lng: number): string {
    // works on web + mobile
    return `https://maps.google.com/?q=${lat},${lng}`;
  }
}

// ------------ OpenStreetMap via LocationIQ ------------
export class OSMProvider implements MapProvider {
  name: MapProviderName = 'openstreetmap';
  constructor(private opts: ProviderOpts) {}
  getStaticMapUrl(lat: number, lng: number, opts?: { zoom?: number; width?: number; height?: number }): string {
    const key = this.opts.locationIqKey;
    const zoom = opts?.zoom ?? 15;
    const width = opts?.width ?? 600;
    const height = opts?.height ?? 320;
    // LocationIQ static map API (OSM-backed). See their docs for style params.
    return `https://maps.locationiq.com/v2/staticmap?key=${key}&center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=icon:large-red-cutout|${lat},${lng}`;
  }
  getMapsLink(lat: number, lng: number): string {
    // Deep link to openstreetmap
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }
  getAttribution() {
    return '© OpenStreetMap contributors';
  }
}

// ------------ Factory ------------
export function createMapProvider(
  name: MapProviderName,
  keys: ProviderOpts
): MapProvider {
  if (name === 'google') return new GoogleProvider(keys);
  return new OSMProvider(keys);
}
