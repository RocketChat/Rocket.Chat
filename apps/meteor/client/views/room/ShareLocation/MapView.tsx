// MapView.tsx
import React from 'react';
import type { MapProviderName, MapProvider } from '../ShareLocation/mapProvider';

export type MapViewProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  width?: number;
  height?: number;

  /**
   * Optional: make MapView provider-aware.
   * If present, we'll use mapInstance to render a provider-specific static map.
   * If omitted, we fall back to a neutral placeholder so legacy callers still work.
   */
  provider?: MapProviderName;
  mapInstance?: MapProvider;

  // Optional: show a tiny attribution line beneath the map (defaults true)
  showAttribution?: boolean;
};

const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  zoom = 17,
  width = 512,
  height = 512,
  provider,
  mapInstance,
  showAttribution = true,
}) => {
  // If a provider instance is provided, use it to compute a static map URL
  const staticUrl =
    mapInstance?.getStaticMapUrl(latitude, longitude, { zoom, width, height }) ?? null;
  const attribution = mapInstance?.getAttribution?.();

  if (staticUrl) {
    return (
      <div style={{ display: 'inline-block' }}>
        <div
          style={{
            width,
            maxWidth: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src={staticUrl}
            alt="Map preview"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>
        {showAttribution && attribution && provider === 'openstreetmap' && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#777' }}>{attribution}</div>
        )}
      </div>
    );
  }

  // Fallback: neutral placeholder (legacy behavior safety net)
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        border: '1px solid #ddd',
        display: 'grid',
        placeItems: 'center',
        background: '#fafafa',
        color: '#666',
        fontSize: 12,
      }}
      aria-label="Map preview unavailable"
      title="Map preview unavailable"
    >
      Map preview unavailable
      <div style={{ fontSize: 11, marginTop: 4 }}>
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </div>
    </div>
  );
};

export default MapView;
