import type { CallDeviceSelection } from '@rocket.chat/ui-conference';
import { useMediaDevices, useUpdateCallPreferences } from '@rocket.chat/ui-conference';
import type { Device } from '@rocket.chat/ui-contexts';
import type { Room } from 'livekit-client';
import { useCallback, useEffect, useMemo } from 'react';

import { useActiveDevice } from './useActiveDevice';

const warn = (what: string) => (err: unknown) => console.warn(`${what} switch failed`, err);

type ArrivalDevices = { micId?: string; camId?: string; speakerId?: string };

/**
 * Which devices the call is on, and switching them during it.
 *
 * `arrival` is what the preflight chose, applied to the room as its capture defaults — read every time a track is
 * created, so a call joined muted still opens the chosen microphone when it is unmuted.
 */
export const useCallDeviceSwitching = (room: Room, arrival: ArrivalDevices | undefined): CallDeviceSelection => {
	const persistDevicePreference = useUpdateCallPreferences();

	const { micId, camId, speakerId } = arrival ?? {};

	// Not `exact`: a device chosen in the preflight can be gone by the time the call opens it.
	useEffect(() => {
		if (micId) {
			void room.switchActiveDevice('audioinput', micId, false).catch(warn('audioinput'));
		}
		if (camId) {
			void room.switchActiveDevice('videoinput', camId, false).catch(warn('videoinput'));
		}
		if (speakerId) {
			void room.switchActiveDevice('audiooutput', speakerId).catch(warn('audiooutput'));
		}
	}, [room, micId, camId, speakerId]);

	const selectCamera = useCallback(
		(deviceId: string) => {
			persistDevicePreference({ camId: deviceId });
			void room.switchActiveDevice('videoinput', deviceId).catch(warn('camera'));
		},
		[room, persistDevicePreference],
	);

	const selectAudioDevice = useCallback(
		(device: Device) => {
			const kind = device.type === 'audiooutput' ? 'audiooutput' : 'audioinput';
			persistDevicePreference(kind === 'audiooutput' ? { speakerId: device.id } : { micId: device.id });

			void room.switchActiveDevice(kind, device.id).catch(warn(kind));
		},
		[room, persistDevicePreference],
	);

	const audioinput = useActiveDevice(room, 'audioinput');
	const audiooutput = useActiveDevice(room, 'audiooutput');
	const videoinput = useActiveDevice(room, 'videoinput');
	const activeDeviceIds = useMemo(() => ({ audioinput, audiooutput, videoinput }), [audioinput, audiooutput, videoinput]);

	const { devices } = useMediaDevices();

	return useMemo(
		() => ({ devices, selectAudioDevice, selectCamera, activeDeviceIds }),
		[devices, selectAudioDevice, selectCamera, activeDeviceIds],
	);
};
