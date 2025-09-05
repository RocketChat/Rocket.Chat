// LiveLocationModal.tsx — provider-aware live location (clean Google / OSM)
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { LiveLocationService, type LocationState } from './liveLocationService';
import { useLiveLocationStopListener } from './useLiveLocationStopListener';
import { createMapProvider, type MapProviderName, type MapProvider } from './mapProvider';

type Props = {
  rid: string;
  tmid?: string;
  onClose: () => void;
};

const LiveLocationChatWidget = ({ rid, tmid, onClose }: Props): ReactElement => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [gpsUpdateCount, setGpsUpdateCount] = useState(0);
  const [lastMessageUpdate, setLastMessageUpdate] = useState<Date | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position2D, setPosition2D] = useState({ x: 0, y: 0 });

  const messageIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const isClosingRef = useRef(false);
  const isSharingRef = useRef(false);
  const serviceRef = useRef<LiveLocationService | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const sendMessage = useEndpoint('POST', '/v1/chat.sendMessage');
  const updateMessage = useEndpoint('POST', '/v1/chat.update');
  const { stopLiveLocationSharing } = useLiveLocationStopListener();

  // --- Provider (shared via localStorage with the static modal) -------------
  const [provider, setProvider] = useState<MapProviderName>(() => {
    const saved = localStorage.getItem('mapProvider') as MapProviderName | null;
    return saved ?? 'openstreetmap';
  });
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mapProvider' && e.newValue) setProvider(e.newValue as MapProviderName);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Keys (swap to app settings if you have them)
  const googleMapsApiKey = 'AIzaSyBeNJSMCi8kD4c6SOvZ4vxHnWYp2yzDbmg';
  const locationIQKey = 'pk.898e468814facdcffda869b42260a2f0';

  const map: MapProvider = useMemo(
    () =>
      createMapProvider(provider, {
        googleApiKey: googleMapsApiKey,
        locationIqKey: locationIQKey,
      }),
    [provider, googleMapsApiKey, locationIQKey],
  );

  const cacheBust = (url: string) => url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();

  // ---------- Provider-aware attachment (clean theme + retina) --------------
  const createLiveLocationAttachment = useCallback(
    (pos: GeolocationPosition, isLive: boolean = true) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const mapsLink = map.getMapsLink(latitude, longitude);
      const staticMapUrl = map.getStaticMapUrl(latitude, longitude, {
        zoom: 16,
        width: 640,
        height: 360,
        // theme + scale are used by the Google provider; ignored by OSM provider
        // @ts-expect-error allow extra options if your interface is stricter
        theme: 'clean',
        scale: 2,
      });

      return {
        ts: new Date(),
        title: isLive ? '📍 Live Location (Active)' : '📍 Location Shared',
        title_link: mapsLink,
        image_url: staticMapUrl,
        image_type: 'image/png',
        text: isLive ? 'Click to view live location updates' : 'Static location',
        // Keep fields present (empty) to satisfy renderers that assume the key exists
        fields: [] as any[],
        actions: [
          {
            type: 'button',
            text: isLive ? '👁️ View Live Location' : '🗺️ View Location',
            msg: `/viewlocation ${messageIdRef.current || 'temp'}`,
            msg_in_chat_window: false,
            msg_processing_type: 'sendMessage',
          },
        ],
        // Optional: include coords
        // description: `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}${
        //   accuracy ? ` (±${Math.round(accuracy)}m)` : ''
        // }`,
        customFields: {
          isLiveLocation: isLive,
          locationId: messageIdRef.current,
          lastUpdate: new Date().toISOString(),
          coordinates: { lat: latitude, lng: longitude, accuracy },
        },
      };
    },
    [map],
  );

  // ---------- Prevent closing while sharing ---------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSharingRef.current && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSharingRef.current) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, []);

  // ---------- Initial placement ---------------------------------------------
  useEffect(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const defaultWidth = 360;
    const defaultHeight = 240;
    setPosition2D({
      x: Math.max(12, w - defaultWidth - 12),
      y: Math.max(60, h - defaultHeight - 12),
    });
  }, []);

  // ---------- Dragging ------------------------------------------------------
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && modalRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const maxX = window.innerWidth - modalRef.current.offsetWidth;
        const maxY = window.innerHeight - modalRef.current.offsetHeight;
        setPosition2D({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // ---------- Initialize live service (watchers/timers only) ----------------
  useEffect(() => {
    serviceRef.current = new LiveLocationService({
      locationIQKey: locationIQKey,
      updateInterval: 10000,
      minMoveMeters: 5,
    });
    if (typeof window !== 'undefined') (window as any).liveLocationService = serviceRef.current;
    return () => {
      if (serviceRef.current && !isSharingRef.current) serviceRef.current.cleanup();
      if (typeof window !== 'undefined') delete (window as any).liveLocationService;
    };
  }, [locationIQKey]);

  // ---------- Messaging (provider-aware attachments) ------------------------
  const sendInitialMessage = useCallback(
    async (pos: GeolocationPosition) => {
      if (!serviceRef.current || sendingRef.current || isClosingRef.current) return;
      sendingRef.current = true;
      try {
        const tempMessageId = `live-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        messageIdRef.current = tempMessageId;

        const attachment = createLiveLocationAttachment(pos, true);

        const response = await sendMessage({
          message: {
            rid,
            tmid,
            msg: '📍 Started sharing live location',
            attachments: [attachment],
          },
        });

        if (!isClosingRef.current) {
          messageIdRef.current = response.message._id;
          serviceRef.current.updateLastUpdateTime();
          setLastMessageUpdate(new Date());
          LiveLocationService.storeLiveLocationData(response.message._id, rid);

          const updatedAttachment = createLiveLocationAttachment(pos, true);
          await updateMessage({
            roomId: rid,
            msgId: response.message._id,
            text: '📍 Started sharing live location',
            attachments: [updatedAttachment],
            customFields: {},
          } as any);
        }
      } catch (err) {
        console.error('[Send Initial Error]', err);
        setError('Failed to send initial location');
        setLocationState('error');
      } finally {
        sendingRef.current = false;
      }
    },
    [sendMessage, updateMessage, rid, tmid, createLiveLocationAttachment],
  );

  const updateLiveLocationMessage = useCallback(
    async (pos: GeolocationPosition) => {
      if (!serviceRef.current || !messageIdRef.current || sendingRef.current || isClosingRef.current) return;
      sendingRef.current = true;
      try {
        const attachment = createLiveLocationAttachment(pos, true);
        await updateMessage({
          roomId: rid,
          msgId: messageIdRef.current,
          text: '📍 Live location (Active)',
          attachments: [attachment],
          customFields: {},
        } as any);
        serviceRef.current.updateLastUpdateTime();
        setLastMessageUpdate(new Date());
      } catch (err) {
        console.error('[Update Location Error]', err);
      } finally {
        sendingRef.current = false;
      }
    },
    [updateMessage, rid, createLiveLocationAttachment],
  );

  const handlePositionSuccess = useCallback(
    (pos: GeolocationPosition) => {
      if (isClosingRef.current) return;
      const prev = position;
      setPosition(pos);
      setError(null);
      setGpsUpdateCount((c) => c + 1);
      if (!isSharingRef.current) return;
      if (locationState !== 'sharing') setLocationState('sharing');
      if (!messageIdRef.current) {
        void sendInitialMessage(pos);
      } else if (serviceRef.current?.shouldPushUpdate(prev, pos)) {
        void updateLiveLocationMessage(pos);
      }
    },
    [position, locationState, sendInitialMessage, updateLiveLocationMessage],
  );

  const handlePositionError = useCallback(
    (err: GeolocationPositionError) => {
      if (isClosingRef.current) return;
      if (err.code === err.PERMISSION_DENIED) {
        setError('Location permission is denied');
        setLocationState('error');
        return;
      }
      console.warn('[Geolocation transient error]', err);
      if (isSharingRef.current && serviceRef.current) {
        setTimeout(() => {
          if (!isClosingRef.current && isSharingRef.current && serviceRef.current) {
            serviceRef.current.startWatching(handlePositionSuccess, handlePositionError);
          }
        }, 1500);
      }
    },
    [handlePositionSuccess],
  );

  const startSharing = useCallback(() => {
    if (isClosingRef.current || !serviceRef.current) return;
    isSharingRef.current = true;
    setLocationState('sharing');
    serviceRef.current.startSharing();
    if (position) handlePositionSuccess(position);
  }, [position, handlePositionSuccess]);

  const stopSharing = useCallback(async () => {
    if (!serviceRef.current) return;
    isSharingRef.current = false;
    serviceRef.current.stopSharing();

    if (messageIdRef.current && position) {
      try {
        const finalAttachment = createLiveLocationAttachment(position, false);
        await updateMessage({
          roomId: rid,
          msgId: messageIdRef.current,
          text: '📍 Live location sharing stopped',
          attachments: [finalAttachment],
          customFields: {},
        } as any);
      } catch (err) {
        console.error('[Stop sharing update error]', err);
      }
    }

    await stopLiveLocationSharing(rid, messageIdRef.current || undefined, position || undefined);
    messageIdRef.current = null;
    setLocationState('waiting');
  }, [stopLiveLocationSharing, rid, position, createLiveLocationAttachment, updateMessage]);

  const handleClose = useCallback(() => {
    if (isSharingRef.current) {
      if (window.confirm('Live location sharing is active. Stop sharing and close?')) {
        stopSharing().then(() => {
          isClosingRef.current = true;
          serviceRef.current?.cleanup();
          onClose();
        });
      }
      return;
    }
    isClosingRef.current = true;
    serviceRef.current?.cleanup();
    onClose();
  }, [onClose, stopSharing]);

  // Start watching on mount
  useEffect(() => {
    if (!serviceRef.current) return;
    serviceRef.current.startWatching(handlePositionSuccess, handlePositionError);
    return () => {
      if (!isSharingRef.current && serviceRef.current) serviceRef.current.cleanup();
    };
  }, [handlePositionSuccess, handlePositionError]);

  const getStatusIcon = () => (locationState === 'waiting' ? '📡' : locationState === 'sharing' ? '📍' : '❌');
  const getStatusText  = () => (locationState === 'waiting' ? 'Getting location...' : locationState === 'sharing' ? 'Live sharing active' : 'Location error');

  // Provider-aware preview (clean theme + retina)
  const previewUrl =
    position
      ? cacheBust(
          map.getStaticMapUrl(position.coords.latitude, position.coords.longitude, {
            zoom: 15,
            width: 320,
            height: 180,
            // @ts-expect-error allow extra options if interface is strict
            theme: 'clean',
            scale: 2,
          }),
        )
      : '';

  // -------------------------- UI -------------------------------------------
  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          top: position2D.y,
          left: position2D.x,
          backgroundColor: locationState === 'sharing' ? '#28a745' : '#007bff',
          color: 'white',
          borderRadius: '50%',
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10000,
          userSelect: 'none',
        }}
        onClick={() => setIsMinimized(false)}
        onMouseDown={handleMouseDown}
        title={getStatusText()}
      >
        <span style={{ fontSize: 24 }}>{getStatusIcon()}</span>
        {locationState === 'sharing' && (
          <div
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              backgroundColor: '#ff4444',
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .location-modal { user-select: none; }
        .location-modal .drag-handle { cursor: move; }
        .location-modal.sharing {
          border: 2px solid #28a745 !important;
          box-shadow: 0 0 20px rgba(40, 167, 69, 0.3) !important;
        }
      `}</style>

      <div
        ref={modalRef}
        className={`location-modal ${locationState === 'sharing' ? 'sharing' : ''}`}
        style={{
          position: 'fixed',
          top: position2D.y,
          left: position2D.x,
          backgroundColor: '#fff',
          border: '1px solid #e1e5e9',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: 320,
          maxWidth: 400,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div
          className="drag-handle"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: locationState === 'sharing' ? '#e8f5e8' : '#f8f9fa',
            borderBottom: '1px solid #e1e5e9',
            borderRadius: '8px 8px 0 0',
            cursor: 'move',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{getStatusIcon()}</span>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{getStatusText()}</span>
            {isSharingRef.current && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#28a745',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 12 }}
              title="Minimize"
            >
              ➖
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                fontSize: 12,
                color: isSharingRef.current ? '#dc3545' : 'inherit',
              }}
              title={isSharingRef.current ? 'Stop sharing to close' : 'Close'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 16 }}>
          {locationState === 'error' && (
            <div style={{ color: '#dc3545', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>
                Please enable location access in your browser settings.
              </p>
            </div>
          )}

          {locationState === 'waiting' && (
            <>
              {position ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <img
                      alt="Map preview"
                      src={previewUrl}
                      style={{
                        width: '100%',
                        height: 160,
                        borderRadius: 6,
                        objectFit: 'cover',
                        border: '1px solid #e1e5e9',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                    <div><strong>Lat:</strong> {position.coords.latitude.toFixed(6)}</div>
                    <div><strong>Lng:</strong> {position.coords.longitude.toFixed(6)}</div>
                    {position.coords.accuracy && (
                      <div><strong>Accuracy:</strong> ±{Math.round(position.coords.accuracy)}m</div>
                    )}
                  </div>

                  <button
                    onClick={startSharing}
                    style={{
                      width: '100%',
                      padding: 10,
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    📍 Start Live Sharing
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
                  <div style={{ fontSize: 14 }}>Getting your location...</div>
                </div>
              )}
            </>
          )}

          {locationState === 'sharing' && (
            <div>
              {position && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <img
                      alt="Live location"
                      src={previewUrl}
                      style={{
                        width: '100%',
                        height: 160,
                        borderRadius: 6,
                        objectFit: 'cover',
                        border: '2px solid #28a745',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                    <div><strong>Lat:</strong> {position.coords.latitude.toFixed(6)}</div>
                    <div><strong>Lng:</strong> {position.coords.longitude.toFixed(6)}</div>
                    {position.coords.accuracy && (
                      <div><strong>Accuracy:</strong> ±{Math.round(position.coords.accuracy)}m</div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      {lastMessageUpdate && <div>Last update: {lastMessageUpdate.toLocaleTimeString()}</div>}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#e8f5e8',
                      padding: 8,
                      borderRadius: 4,
                      fontSize: 12,
                      marginBottom: 12,
                      color: '#155724',
                    }}
                  >
                    ✅ Sharing live location every 10 seconds
                    <br />
                    <small>Others can click "View Live Location" to see updates</small>
                  </div>
                </>
              )}

              <button
                onClick={stopSharing}
                style={{
                  width: '100%',
                  padding: 10,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                🛑 Stop Sharing
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveLocationChatWidget;
