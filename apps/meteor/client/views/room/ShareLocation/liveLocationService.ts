// liveLocationService.ts
export type LocationState = 'waiting' | 'sharing' | 'error';

export interface LocationServiceConfig {
  locationIQKey: string;
  updateInterval: number;
  minMoveMeters: number;
}

export class LiveLocationService {
  private config: LocationServiceConfig;
  private watchId: number | null = null;
  private pollTimerRef: number | null = null;
  private sharingIntervalRef: number | null = null;
  private isSharing = false;
  private lastUpdateTime = 0;
  private onPositionSuccess?: (position: GeolocationPosition) => void;
  private onPositionError?: (error: GeolocationPositionError) => void;

  constructor(config: LocationServiceConfig) {
    this.config = config;
    this.setupDevelopmentMock();
  }

  private setupDevelopmentMock() {
    if (process.env.NODE_ENV === 'development') {
      let lat = 40.7128; // starting latitude (NYC)
      let lon = -74.0060; // starting longitude (NYC)

      navigator.geolocation.getCurrentPosition = (success, error) => {
        success({
          coords: {
            latitude: lat,
            longitude: lon,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        } as GeolocationPosition);
      };

      navigator.geolocation.watchPosition = (success, error) => {
        const watchId = setInterval(() => {
          // Simulate movement
          lat += (Math.random() - 0.5) * 0.001;
          lon += (Math.random() - 0.5) * 0.001;

          success({
            coords: {
              latitude: lat,
              longitude: lon,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          } as GeolocationPosition);
        }, 10000); // every 5 seconds for testing

        return watchId as unknown as number;
      };

      navigator.geolocation.clearWatch = (id) => clearInterval(id as unknown as number);
    }
  }

  generateMapUrls(latitude: number, longitude: number) {
    const mapsLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    const staticMapUrl = `https://maps.locationiq.com/v2/staticmap?key=${this.config.locationIQKey}&center=${latitude},${longitude}&zoom=17&size=512x512&markers=icon:small-red-cutout|${latitude},${longitude}`;
    return { mapsLink, staticMapUrl };
  }

  createLocationAttachment(pos: GeolocationPosition, isLive: boolean = false) {
    const { latitude, longitude, accuracy, heading, speed } = pos.coords;
    const { mapsLink, staticMapUrl } = this.generateMapUrls(latitude, longitude);
    
    const baseAttachment = {
      ts: new Date(),
      title: isLive ? '📍 Live Location (Sharing)' : '📍 Location',
      title_link: mapsLink,
      image_url: staticMapUrl,
      description: [
        `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
        accuracy ? `Accuracy: ±${Math.round(accuracy)}m` : null,
        heading != null ? `Heading: ${heading.toFixed(1)}°` : null,
        speed != null ? `Speed: ${speed.toFixed(1)} m/s` : null,
        isLive ? `Updated: ${new Date().toLocaleTimeString()}` : null,
      ]
        .filter(Boolean)
        .join(' • '),
    };

    // Add action buttons for live location
    if (isLive) {
      return {
        ...baseAttachment,
        actions: [
          {
            type: 'button',
            text: '🛑 Stop Sharing',
            msg: '/stop-live-location',
            msg_in_chat_window: false,
            msg_processing_type: 'sendMessage'
          }
        ]
      };
    }

    return baseAttachment;
  }

  private haversineMeters(a: GeolocationCoordinates, b: GeolocationCoordinates): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  shouldPushUpdate(prev: GeolocationPosition | null, curr: GeolocationPosition): boolean {
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.config.updateInterval) return true;
    if (!prev) return true;
    return this.haversineMeters(prev.coords, curr.coords) >= this.config.minMoveMeters;
  }

  startWatching(
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: GeolocationPositionError) => void
  ) {
    if (!navigator.geolocation) {
      onError({
        code: 2,
        message: 'Geolocation is not supported by this browser',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
      return;
    }

    this.onPositionSuccess = onSuccess;
    this.onPositionError = onError;

    this.watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // Optional heartbeat to smooth out quiet watches
    this.pollTimerRef = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    }, this.config.updateInterval);
  }

  startSharing() {
    this.isSharing = true;
    
    // Set up continuous sharing interval
    this.sharingIntervalRef = window.setInterval(() => {
      if (this.isSharing && this.onPositionSuccess) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (this.isSharing && this.onPositionSuccess) {
              this.onPositionSuccess(pos);
            }
          },
          (error) => {
            if (this.onPositionError) {
              this.onPositionError(error);
            }
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      }
    }, this.config.updateInterval);
  }

  stopSharing() {
    this.isSharing = false;
    
    if (this.sharingIntervalRef !== null) {
      clearInterval(this.sharingIntervalRef);
      this.sharingIntervalRef = null;
    }
  }

  cleanup() {
    this.stopSharing();
    
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    if (this.pollTimerRef !== null) {
      clearInterval(this.pollTimerRef);
      this.pollTimerRef = null;
    }
  }

  updateLastUpdateTime() {
    this.lastUpdateTime = Date.now();
  }

  get isSharingActive(): boolean {
    return this.isSharing;
  }

  // Storage helpers
  static storeLiveLocationData(messageId: string, roomId: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('liveLocationMessageId', messageId);
      window.localStorage.setItem('liveLocationRoomId', roomId);
    }
  }

  static getLiveLocationData(): { messageId: string | null; roomId: string | null } {
    if (typeof window === 'undefined') {
      return { messageId: null, roomId: null };
    }
    
    return {
      messageId: window.localStorage.getItem('liveLocationMessageId'),
      roomId: window.localStorage.getItem('liveLocationRoomId')
    };
  }

  static clearLiveLocationData() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('liveLocationMessageId');
      window.localStorage.removeItem('liveLocationRoomId');
    }
  }
}