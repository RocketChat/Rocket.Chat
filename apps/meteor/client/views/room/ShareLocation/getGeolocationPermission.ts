export const getGeolocationPermission = (): Promise<PermissionState> =>
	new Promise((resolve) => {
		if (!navigator.permissions) {
			resolve('granted');
		}
		navigator.permissions.query({ name: 'geolocation' }).then(({ state }) => {
			resolve(state);
		});
	});
