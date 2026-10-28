import type { Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { useCallback, useSyncExternalStore } from 'react';

/** The device the room has open for `kind`: the one it obtained, which is not always the one asked for. */
export const useActiveDevice = (room: Room, kind: MediaDeviceKind): string | undefined => {
	const subscribe = useCallback(
		(onChange: () => void) => {
			room.on(RoomEvent.ActiveDeviceChanged, onChange);
			return () => {
				room.off(RoomEvent.ActiveDeviceChanged, onChange);
			};
		},
		[room],
	);

	return useSyncExternalStore(subscribe, () => room.getActiveDevice(kind));
};
