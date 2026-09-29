import type { CallDeviceSelection } from '@rocket.chat/ui-conference';
import { useMediaDevices, useUpdateCallPreferences } from '@rocket.chat/ui-conference';
import type { Device } from '@rocket.chat/ui-contexts';
import { useAvailableDevices, useSetInputMediaDevice, useSetOutputMediaDevice } from '@rocket.chat/ui-contexts';
import type { LocalTrackPublication, Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The device id out of a constraint, which the spec allows to be a bare string, a list, or an object with `exact`
 * or `ideal`. LiveKit stores whatever it was given, so all of them turn up here.
 */
const deviceIdFrom = (constraint: MediaTrackConstraints['deviceId']): string | undefined => {
	if (typeof constraint === 'string') {
		return constraint;
	}
	if (Array.isArray(constraint)) {
		return constraint[0];
	}
	const exact = constraint?.exact ?? constraint?.ideal;
	if (typeof exact === 'string') {
		return exact;
	}
	return Array.isArray(exact) ? exact[0] : undefined;
};

const warn = (what: string) => (err: unknown) => console.warn(`${what} switch failed`, err);

type ArrivalDevices = { micId?: string; camId?: string; speakerId?: string };

/**
 * Which devices the call is on, and switching them during it.
 *
 * `arrival` is what the preflight chose, applied to the room as its capture defaults — read every time a track is
 * created, so a call joined muted still opens the chosen microphone when it is unmuted. `outputElement` is what the
 * app's output-device setter is handed to record a choice LiveKit already applied.
 */
export const useCallDeviceSwitching = (
	room: Room,
	cameraPublication: LocalTrackPublication | undefined,
	arrival: ArrivalDevices | undefined,
	outputElement: HTMLAudioElement,
): Omit<CallDeviceSelection, 'videoQuality'> => {
	const setInputDevice = useSetInputMediaDevice();
	const setOutputDevice = useSetOutputMediaDevice();
	const availableDevices = useAvailableDevices();
	const persistDevicePreference = useUpdateCallPreferences();
	// What has already been recorded, so re-running on a new device list can't turn into a write-and-rerender loop.
	const recorded = useRef<Partial<Record<'audioinput' | 'audiooutput', string>>>({});

	const { micId, camId, speakerId } = arrival ?? {};

	// Not `exact`: a device chosen in the preflight can be gone by the time the call opens it.
	useEffect(() => {
		if (micId) {
			void room.switchActiveDevice('audioinput', micId, false).catch(warn('audioinput'));
		}
	}, [room, micId]);

	useEffect(() => {
		if (camId) {
			void room.switchActiveDevice('videoinput', camId, false).catch(warn('videoinput'));
		}
	}, [room, camId]);

	useEffect(() => {
		if (speakerId) {
			void room.switchActiveDevice('audiooutput', speakerId).catch(warn('audiooutput'));
		}
	}, [room, speakerId]);

	// What the app records as the selected devices, made to agree with the devices the call is actually on: the room
	// reports the device obtained rather than the one requested.
	useEffect(() => {
		const record = (kind: 'audioinput' | 'audiooutput') => {
			const deviceId = room.getActiveDevice(kind);
			if (!deviceId || recorded.current[kind] === deviceId) {
				return;
			}

			const device = (kind === 'audioinput' ? availableDevices?.audioInput : availableDevices?.audioOutput)?.find(
				({ id }) => id === deviceId,
			);
			if (!device) {
				return;
			}

			recorded.current[kind] = deviceId;

			if (kind === 'audioinput') {
				setInputDevice(device);
				return;
			}

			// Throws where `setSinkId` does not exist (Firefox), and a tick is not worth an exception.
			try {
				setOutputDevice({ outputDevice: device, HTMLAudioElement: outputElement });
			} catch (err) {
				console.warn('speaker selection not recorded', err);
			}
		};

		const sync = () => {
			record('audioinput');
			record('audiooutput');
		};

		sync();
		room.on(RoomEvent.ActiveDeviceChanged, sync);
		return () => {
			room.off(RoomEvent.ActiveDeviceChanged, sync);
		};
	}, [room, availableDevices, setInputDevice, setOutputDevice, outputElement]);

	// Tracked explicitly: LiveKit can replace the camera track without changing the publication's sid, which the
	// constraint-based answer below would miss.
	const [pickedCameraId, setPickedCameraId] = useState<string | undefined>();

	const selectCamera = useCallback(
		(deviceId: string) => {
			setPickedCameraId(deviceId);
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

	// From the published track's constraints, which stay right when a processor is attached: the processed track
	// reports an empty deviceId in `getSettings()`.
	const cameraTrack = cameraPublication?.track;
	const derivedCameraId = deviceIdFrom(cameraTrack?.constraints?.deviceId) || cameraTrack?.mediaStreamTrack?.getSettings().deviceId;

	const currentCameraId = pickedCameraId ?? derivedCameraId;

	const { devices } = useMediaDevices();

	return useMemo(
		() => ({ devices, selectAudioDevice, selectCamera, currentCameraId }),
		[devices, selectAudioDevice, selectCamera, currentCameraId],
	);
};
