import { useSelectedDevices } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { stopTracks, useDevicePermissionPrompt2 } from './useDevicePermissionPrompt';
import { refreshMediaDevices } from '../devices/mediaDevicesStore';

/**
 * For a device menu's `beforeOpen`: asks for the permission that names the devices of the given kinds, unless they
 * are named already. Unnamed devices are indistinguishable, so a menu of them picks nothing.
 */
export const useRevealDeviceLabels = () => {
	const requestPermission = useDevicePermissionPrompt2();
	const chosenMicId = useSelectedDevices()?.audioInput?.id;

	return useCallback(
		async (kinds: MediaDeviceKind[], devices: MediaDeviceInfo[]) => {
			const listed = devices.filter((device) => kinds.includes(device.kind));
			if (listed.length > 0 && listed.every((device) => device.label)) {
				return;
			}

			if (kinds.some((kind) => kind !== 'videoinput')) {
				// The app's chosen microphone is preferred, not required: it can be unplugged, and the menu exists to pick another.
				const stream = await requestPermission({
					actionType: 'device-change',
					constraints: { audio: chosenMicId ? { deviceId: chosenMicId } : true },
				});
				stopTracks(stream);
			}

			if (kinds.includes('videoinput')) {
				// A refused or absent camera still opens the menu, with whatever the browser lists.
				await navigator.mediaDevices.getUserMedia({ video: true }).then(stopTracks, () => undefined);
			}

			refreshMediaDevices();
		},
		[requestPermission, chosenMicId],
	);
};
