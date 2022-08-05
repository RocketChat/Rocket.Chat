export const getGeolocationPosition = (): Promise<GeolocationPosition> =>
	new Promise((resolvePos, rejectPos) => {
		navigator.geolocation.getCurrentPosition(resolvePos, rejectPos, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 10000,
		});
	});
