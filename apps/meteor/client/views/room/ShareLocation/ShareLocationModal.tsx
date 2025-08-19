// ShareLocationModal.tsx — Provider first, then Current vs Live
import type { IMessage, IRoom, MessageAttachment } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo, useState, useEffect } from 'react';

import { getGeolocationPermission } from './getGeolocationPermission';
import { getGeolocationPosition } from './getGeolocationPosition';
import MapView from './MapView';
import LiveLocationModal from './LiveLocationModal';

import { createMapProvider, type MapProviderName, type MapProvider } from './mapProvider';

type ShareLocationModalProps = {
  rid: IRoom['_id'];
  tmid?: IMessage['tmid'];
  onClose: () => void;
};

type Stage = 'provider' | 'choose' | 'static';

const ShareLocationModal = ({ rid, tmid, onClose }: ShareLocationModalProps): ReactElement => {
  const t = useTranslation();
  const dispatchToast = useToastMessageDispatch();
  const queryClient = useQueryClient();
  const sendMessage = useEndpoint('POST', '/v1/chat.sendMessage');

  // --- New: stages (provider -> choose -> static/live) ---
  const [stage, setStage] = useState<Stage>('provider');
  const [choice, setChoice] = useState<'current' | 'live' | null>(null);

  // Provider picker (persisted)
  const [provider, setProvider] = useState<MapProviderName>(() => {
    const saved = localStorage.getItem('mapProvider') as MapProviderName | null;
    return saved ?? 'openstreetmap';
  });
  useEffect(() => {
    localStorage.setItem('mapProvider', provider);
  }, [provider]);

  // Keys (swap to settings if you have them)
  const googleMapsApiKey = 'AIzaSyBeNJSMCi8kD4c6SOvZ4vxHnWYp2yzDbmg';
  const locationIQKey = 'pk.898e468814facdcffda869b42260a2f0';

  // Provider instance
  const map: MapProvider = useMemo(
    () =>
      createMapProvider(provider, {
        googleApiKey: googleMapsApiKey,
        locationIqKey: locationIQKey,
      }),
    [provider, googleMapsApiKey, locationIQKey],
  );

  // Permission & position queries (only used in static flow)
  const { data: permissionState, isLoading: permissionLoading } = useQuery({
    queryKey: ['geolocationPermission'],
    queryFn: getGeolocationPermission,
    refetchOnWindowFocus: false,
  });

  const {
    data: positionData,
    isLoading: positionLoading,
    isFetching: positionFetching,
    isError: positionError,
    error: positionErr,
  } = useQuery({
    queryKey: ['geolocationPosition'],
    queryFn: () => getGeolocationPosition(),
    enabled: stage === 'static' && permissionState === 'granted',
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // retry ONCE for transient errors; never retry on permission denied
      const e = error as any;
      const code = e?.code;
      const msg = String(e?.message || '').toLowerCase();
      const transient =
        code !== 1 && // not PERMISSION_DENIED
        (code === 2 || msg.includes('kclerrorlocationunknown') || msg.includes('location unknown'));
      return transient && failureCount < 1;
    },
    retryDelay: 1500,
  });

  const onConfirmRequestLocation = async (): Promise<void> => {
    try {
      const pos = await getGeolocationPosition(); // triggers browser prompt
      queryClient.setQueryData(['geolocationPermission'], 'granted');
      queryClient.setQueryData(['geolocationPosition'], pos);
    } catch {
      const state = await getGeolocationPermission();
      queryClient.setQueryData(['geolocationPermission'], state);
    }
  };

  // --- Stage 1: Provider selection (FIRST) ---
  if (stage === 'provider') {
    return (
      <GenericModal
        title="Choose map provider"
        onClose={onClose}
        confirmText="Continue"
        onConfirm={() => setStage('choose')}
        onCancel={onClose}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="provider"
              value="openstreetmap"
              checked={provider === 'openstreetmap'}
              onChange={() => setProvider('openstreetmap')}
            />
            OpenStreetMap
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="provider"
              value="google"
              checked={provider === 'google'}
              onChange={() => setProvider('google')}
            />
            Google
          </label>
          <div style={{ fontSize: 12, color: '#666' }}>
            You can change this later. Your choice is saved for live sharing too.
          </div>
        </div>
      </GenericModal>
    );
  }

  // --- Stage 2: Choose static vs live ---
  if (stage === 'choose' && !choice) {
    return (
      <GenericModal
        title={t('Share_Location_Title')}
        onClose={onClose}
        // cancel = Live, confirm = Current (same UX as before)
        cancelText="Live Location"
        onCancel={() => {
          setChoice('live');
        }}
        confirmText="Current Location"
        onConfirm={() => {
          setChoice('current');
          setStage('static');
        }}
      >
        Choose to share your current location once or start live location sharing.
      </GenericModal>
    );
  }

  // Live path
  if (choice === 'live') {
    // Your LiveLocation modal/widget reads provider from localStorage,
    // which we already saved above.
    return <LiveLocationModal rid={rid} tmid={tmid} onClose={onClose} />;
  }

  // --- Stage 3: Static flow (with permission gating) ---
  if (stage === 'static') {
    // Ask for permission
    if (permissionLoading || permissionState === 'prompt' || permissionState === undefined) {
      return (
        <GenericModal
          title={t('You_will_be_asked_for_permissions')}
          confirmText={t('Continue')}
          onConfirm={onConfirmRequestLocation}
          onClose={onClose}
          onCancel={onClose}
        />
      );
    }

    // Explicitly denied
    if (permissionState === 'denied') {
      return (
        <GenericModal title={t('Cannot_share_your_location')} confirmText={t('Ok')} onConfirm={onClose} onClose={onClose}>
          {t('The_necessary_browser_permissions_for_location_sharing_are_not_granted')}
        </GenericModal>
      );
    }

    // Granted, still fetching coordinates → loader
    if (permissionState === 'granted' && (positionLoading || positionFetching)) {
      return (
        <GenericModal title={t('Share_Location_Title')} confirmText={t('Cancel')} onConfirm={onClose} onClose={onClose}>
          Getting your location…
        </GenericModal>
      );
    }

    // Granted but failed
    if (permissionState === 'granted' && positionError) {
      return (
        <GenericModal
          title={t('Cannot_share_your_location')}
          confirmText='Try_again'
          onConfirm={() => {
            // Clear the error and try again
            queryClient.resetQueries({ queryKey: ['geolocationPosition'] });
          }}
          onClose={onClose}
          cancelText={t('Cancel')}
          onCancel={onClose}
        >
          <div style={{ marginBottom: 16 }}>
            {(positionErr as Error | undefined)?.message || 'Unable to fetch your current location.'}
          </div>
          
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
            <strong>Tips to improve location accuracy:</strong>
            <br />• Move closer to a window or go outside
            <br />• Make sure location services are enabled on your device
            <br />• Check that your browser has location permissions
            <br />• Try refreshing the page and allowing location access again
          </div>
        </GenericModal>
      );
    }

    const onConfirmStatic = (): void => {
      if (!positionData) return;
      const { latitude, longitude, accuracy } = positionData.coords;

      if (provider === 'google' && !googleMapsApiKey) {
        dispatchToast({
          type: 'warning',
          message: 'Google Maps API key is missing; consider using OpenStreetMap.',
        });
      }

      try {
        const mapsLink = map.getMapsLink(latitude, longitude);
        const staticMapUrl = map.getStaticMapUrl(latitude, longitude, { zoom: 17, width: 512, height: 512 });

        const attachment: MessageAttachment = {
          ts: new Date(),
          title: '📍 Shared Location',
          title_link: mapsLink,
          image_url: staticMapUrl,
          image_type: 'image/png',
          // keep fields as empty array to avoid any renderer crashes
          fields: [],
        };

        void sendMessage({
          message: {
            rid,
            tmid,
            attachments: [attachment],
          },
        });
      } catch (error) {
        dispatchToast({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      } finally {
        onClose();
      }
    };

    // Static share preview + confirm
    return (
      <GenericModal
        title={t('Share_Location_Title')}
        confirmText={t('Share')}
        onConfirm={onConfirmStatic}
        onClose={onClose}
        onCancel={onClose}
      >
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          Provider: {provider === 'google' ? 'Google Maps' : 'OpenStreetMap'}
        </div>

        {positionData && (
          <MapView
            latitude={positionData.coords.latitude}
            longitude={positionData.coords.longitude}
            provider={provider}
            mapInstance={map}
            showAttribution={false}
            width={512}   
            height={512}
          />
        )}
      </GenericModal>
    );
  }

  // Should never hit here
  return <></>;
};

export default ShareLocationModal;
