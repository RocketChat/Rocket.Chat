import type { DeviceSelection } from '@rocket.chat/ui-conference';
import { callDeviceIdField, useMediaDevices, useUpdateCallPreferences } from '@rocket.chat/ui-conference';
import type { Room } from 'livekit-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useActiveDevice } from './useActiveDevice';

const warn = (what: string) => (err: unknown) => console.warn(`${what} switch failed`, err);

type ArrivalDevices = { micId?: string; camId?: string; speakerId?: string };

/**
 * Which devices the call is on, and switching them during it.
 *
 * `arrival` is what the preflight chose, applied to the room as its capture defaults — read every time a track is
 * created, so a call joined muted still opens the chosen microphone when it is unmuted.
 */
export const useCallDeviceSwitching = (room: Room, arrival: ArrivalDevices | undefined): DeviceSelection => {
	const persistDevicePreference = useUpdateCallPreferences();

	// One switch at a time per kind, in the order asked: LiveKit does not queue them, and a slow one finishing last
	// would leave the call on a device the reader has already moved off.
	const [switches] = useState(() => new Map<MediaDeviceKind, Promise<unknown>>());
	const switchDevice = useCallback(
		(kind: MediaDeviceKind, deviceId: string, exact?: boolean): Promise<boolean> => {
			const next = (switches.get(kind) ?? Promise.resolve()).then(() => room.switchActiveDevice(kind, deviceId, exact));
			switches.set(
				kind,
				next.catch(() => undefined),
			);
			return next;
		},
		[room, switches],
	);

	const { micId, camId, speakerId } = arrival ?? {};

	// Not `exact`: a device chosen in the preflight can be gone by the time the call opens it.
	useEffect(() => {
		if (micId) {
			switchDevice('audioinput', micId, false).catch(warn('audioinput'));
		}
		if (camId) {
			switchDevice('videoinput', camId, false).catch(warn('videoinput'));
		}
		if (speakerId) {
			switchDevice('audiooutput', speakerId).catch(warn('audiooutput'));
		}
	}, [switchDevice, micId, camId, speakerId]);

	const select = useCallback(
		(kind: MediaDeviceKind, deviceId: string) => {
			switchDevice(kind, deviceId)
				.then((switched) => {
					// Remembered once it took, so the next call does not start on a device this one could not open.
					if (switched) {
						persistDevicePreference({ [callDeviceIdField[kind]]: deviceId });
					}
				})
				.catch(warn(kind));
		},
		[switchDevice, persistDevicePreference],
	);

	const audioinput = useActiveDevice(room, 'audioinput');
	const audiooutput = useActiveDevice(room, 'audiooutput');
	const videoinput = useActiveDevice(room, 'videoinput');
	const selectedIds = useMemo(() => ({ audioinput, audiooutput, videoinput }), [audioinput, audiooutput, videoinput]);

	const { devices } = useMediaDevices();

	return useMemo(() => ({ devices, selectedIds, select }), [devices, selectedIds, select]);
};
