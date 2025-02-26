import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

type MediaDevices = 'camera' | 'microphone';

const getDeviceKind = (name: MediaDevices): MediaDeviceKind => {
	switch (name) {
		case 'camera':
			return 'videoinput';
		case 'microphone':
			return 'audioinput';
	}
};

export const useMediaPermissions = (name: MediaDevices): [isPermissionDenied: boolean, setIsPermissionDenied: (state: boolean) => void] => {
	const [isPermissionDenied, setIsPermissionDenied] = useState(false);

	const handleMount = useEffectEvent(async (): Promise<(() => void) | void> => {
		if (navigator.permissions) {
			try {
				const permissionStatus = await navigator.permissions.query({ name: name as PermissionName });
				setIsPermissionDenied(permissionStatus.state === 'denied');

				// We need this to be a function declaration so that we can use `this` parameter
				// eslint-disable-next-line no-inner-declarations
				function permissionChangeEvent(this: PermissionStatus) {
					setIsPermissionDenied(this.state === 'denied');
				}
				permissionStatus.addEventListener('change', permissionChangeEvent);
				return () => permissionStatus.removeEventListener('change', permissionChangeEvent);
			} catch (error) {
				console.warn(error);
			}
		}

		if (!navigator.mediaDevices?.enumerateDevices) {
			setIsPermissionDenied(true);
			return;
		}

		try {
			if (!(await navigator.mediaDevices.enumerateDevices()).some(({ kind }) => kind === getDeviceKind(name))) {
				setIsPermissionDenied(true);
			}
		} catch (error) {
			console.warn(error);
		}
	});

	useEffect(() => {
		let offCallback;

		const mount = async () => {
			offCallback = await handleMount();
		};

		mount();

		return offCallback;
	}, [handleMount]);

	return [isPermissionDenied, setIsPermissionDenied];
};
