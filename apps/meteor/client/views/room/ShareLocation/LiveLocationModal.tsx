// LiveLocationModal.tsx - Enhanced version with persistent modal
import { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { LiveLocationService, type LocationState } from './liveLocationService';
import { useLiveLocationStopListener } from './useLiveLocationStopListener';

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

  // Prevent modal from being closed when clicking outside while sharing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSharingRef.current && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Prevent the modal from closing when sharing is active
        event.stopPropagation();
        event.preventDefault();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSharingRef.current) {
        // Prevent ESC key from closing when sharing
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

  // Dragging functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && modalRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - modalRef.current.offsetWidth;
        const maxY = window.innerHeight - modalRef.current.offsetHeight;
        
        setPosition2D({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new LiveLocationService({
      locationIQKey: 'pk.898e468814facdcffda869b42260a2f0',
      updateInterval: 10000,
      minMoveMeters: 5
    });

    if (typeof window !== 'undefined') {
      (window as any).liveLocationService = serviceRef.current;
    }

    return () => {
      if (serviceRef.current && !isSharingRef.current) {
        serviceRef.current.cleanup();
      }
      if (typeof window !== 'undefined') {
        delete (window as any).liveLocationService;
      }
    };
  }, []);

  const sendInitialMessage = useCallback(
    async (pos: GeolocationPosition) => {
      if (!serviceRef.current || sendingRef.current || isClosingRef.current) return;
      sendingRef.current = true;

      try {
        const attachment = serviceRef.current.createLocationAttachment(pos, true);
        const response = await sendMessage({
          message: {
            rid,
            tmid,
            attachments: [attachment],
          },
        });

        if (!isClosingRef.current) {
          messageIdRef.current = response.message._id;
          serviceRef.current.updateLastUpdateTime();
          setLastMessageUpdate(new Date());
          LiveLocationService.storeLiveLocationData(response.message._id, rid);
        }
      } catch (err) {
        console.error('[Send Initial Error]', err);
        setError('Failed to send initial location');
        setLocationState('error');
      } finally {
        sendingRef.current = false;
      }
    },
    [sendMessage, rid, tmid],
  );

  const updateLiveLocationMessage = useCallback(
    async (pos: GeolocationPosition) => {
      if (!serviceRef.current || !messageIdRef.current || sendingRef.current || isClosingRef.current) return;

      sendingRef.current = true;
      try {
        const attachment = serviceRef.current.createLocationAttachment(pos, true);

        const updatePayload = {
          roomId: rid,
          msgId: messageIdRef.current,
          text: '',
          attachments: [attachment],
          customFields: {},
        };

        await updateMessage(updatePayload);
        serviceRef.current.updateLastUpdateTime();
        setLastMessageUpdate(new Date());
      } catch (err) {
        console.error('[Update Location Error]', err);
      } finally {
        sendingRef.current = false;
      }
    },
    [updateMessage, rid],
  );

  const handlePositionSuccess = useCallback(
    (pos: GeolocationPosition) => {
      if (isClosingRef.current) return;

      const prev = position;
      setPosition(pos);
      setError(null);
      setGpsUpdateCount((c) => c + 1);

      if (!isSharingRef.current) {
        return;
      }

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

    if (position) {
      handlePositionSuccess(position);
    }
  }, [position, handlePositionSuccess]);

  const stopSharing = useCallback(async () => {
    if (!serviceRef.current) return;

    isSharingRef.current = false;
    serviceRef.current.stopSharing();

    await stopLiveLocationSharing(rid, messageIdRef.current || undefined, position || undefined);
    
    messageIdRef.current = null;
    setLocationState('waiting');
  }, [stopLiveLocationSharing, rid, position]);

  const handleClose = useCallback(() => {
    // Only allow closing if not currently sharing
    if (isSharingRef.current) {
      // Show confirmation dialog
      if (window.confirm('Live location sharing is active. Stop sharing and close?')) {
        stopSharing().then(() => {
          isClosingRef.current = true;
          if (serviceRef.current) {
            serviceRef.current.cleanup();
          }
          onClose();
        });
      }
      return;
    }

    isClosingRef.current = true;
    if (serviceRef.current) {
      serviceRef.current.cleanup();
    }
    onClose();
  }, [onClose, stopSharing]);

  // Start watching on mount
  useEffect(() => {
    if (!serviceRef.current) return;

    serviceRef.current.startWatching(handlePositionSuccess, handlePositionError);

    return () => {
      if (!isSharingRef.current && serviceRef.current) {
        serviceRef.current.cleanup();
      }
    };
  }, [handlePositionSuccess, handlePositionError]);

  const getStatusIcon = () => {
    switch (locationState) {
      case 'waiting': return '📡';
      case 'sharing': return '📍';
      case 'error': return '❌';
      default: return '📡';
    }
  };

  const getStatusText = () => {
    switch (locationState) {
      case 'waiting': return 'Getting location...';
      case 'sharing': return 'Live sharing active';
      case 'error': return 'Location error';
      default: return 'Preparing...';
    }
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          bottom: position2D.y || '20px',
          right: position2D.x || '20px',
          backgroundColor: locationState === 'sharing' ? '#28a745' : '#007bff',
          color: 'white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
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
        <span style={{ fontSize: '24px' }}>{getStatusIcon()}</span>
        {locationState === 'sharing' && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            backgroundColor: '#ff4444',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
          .location-modal {
            user-select: none;
          }
          .location-modal .drag-handle {
            cursor: move;
          }
          .location-modal.sharing {
            border: 2px solid #28a745 !important;
            box-shadow: 0 0 20px rgba(40, 167, 69, 0.3) !important;
          }
        `}
      </style>
      
      <div
        ref={modalRef}
        className={`location-modal ${locationState === 'sharing' ? 'sharing' : ''}`}
        style={{
          position: 'fixed',
          bottom: position2D.y || '60px',
          right: position2D.x || '12px',
          backgroundColor: '#fff',
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '320px',
          maxWidth: '400px',
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header - draggable */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{getStatusIcon()}</span>
            <span style={{ fontWeight: '500', fontSize: '14px' }}>
              {getStatusText()}
            </span>
            {isSharingRef.current && (
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#28a745',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '12px',
              }}
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
                padding: '4px',
                fontSize: '12px',
                color: isSharingRef.current ? '#dc3545' : 'inherit'
              }}
              title={isSharingRef.current ? "Stop sharing to close" : "Close"}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
            {locationState === 'error' && (
              <div style={{ color: '#dc3545', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                  Please enable location access in your browser settings.
                </p>
              </div>
            )}

            {locationState === 'waiting' && (
              <>
                {position ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        alt="Map preview"
                        src={
                          serviceRef.current?.generateMapUrls(position.coords.latitude, position.coords.longitude).staticMapUrl +
                          `&ts=${Date.now()}`
                        }
                        style={{
                          width: '100%',
                          height: '160px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid #e1e5e9',
                        }}
                      />
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
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
                        padding: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      📍 Start Live Sharing
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📡</div>
                    <div style={{ fontSize: '14px' }}>Getting your location...</div>
                  </div>
                )}
              </>
            )}

            {locationState === 'sharing' && (
              <div>
                {position && (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        alt="Live location"
                        src={
                          serviceRef.current?.generateMapUrls(position.coords.latitude, position.coords.longitude).staticMapUrl +
                          `&ts=${Date.now()}`
                        }
                        style={{
                          width: '100%',
                          height: '160px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '2px solid #28a745',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                      <div><strong>Lat:</strong> {position.coords.latitude.toFixed(6)}</div>
                      <div><strong>Lng:</strong> {position.coords.longitude.toFixed(6)}</div>
                      {position.coords.accuracy && (
                        <div><strong>Accuracy:</strong> ±{Math.round(position.coords.accuracy)}m</div>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '11px' }}>
                        {lastMessageUpdate && (
                          <div>Last update: {lastMessageUpdate.toLocaleTimeString()}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ 
                      backgroundColor: '#e8f5e8', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      marginBottom: '12px',
                      color: '#155724'
                    }}>
                      ✅ Sharing live location every 10 seconds
                    </div>
                  </>
                )}

                <button
                  onClick={stopSharing}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
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