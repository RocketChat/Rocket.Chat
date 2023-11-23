import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
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

	const handleMount = useMutableCallback(async (): Promise<void> => {
		if (navigator.permissions) {
			try {
				const permissionStatus = await navigator.permissions.query({ name: name as PermissionName });
				setIsPermissionDenied(permissionStatus.state === 'denied');
				permissionStatus.onchange = (): void => {
					setIsPermissionDenied(permissionStatus.state === 'denied');
				};
				return;
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
		handleMount();
	}, [handleMount]);

	return [isPermissionDenied, setIsPermissionDenied];
};
