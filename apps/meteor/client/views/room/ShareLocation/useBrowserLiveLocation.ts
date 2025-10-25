import { useEffect, useRef, useState } from 'react';

export function useBrowserLiveLocation(throttleMs = 10000) {
	const [coord, setCoord] = useState<{ lon: number; lat: number } | null>(null);
	const lastSentRef = useRef(0);
	useEffect(() => {
		if (!navigator.geolocation) return;

		const watchId = navigator.geolocation.watchPosition(
			(p) => {
				const { latitude, longitude } = p.coords;
				setCoord({ lon: longitude, lat: latitude });
			},
			() => {
				// Error handler - no action needed for this implementation
			},
			{ enableHighAccuracy: true, maximumAge: 5000 },
		);
		return () => navigator.geolocation.clearWatch(watchId);
	}, []);

	function shouldPublish() {
		const now = Date.now();
		if (now - lastSentRef.current >= throttleMs) {
			lastSentRef.current = now;
			return true;
		}
		return false;
	}

	return { coord, shouldPublish };
}
