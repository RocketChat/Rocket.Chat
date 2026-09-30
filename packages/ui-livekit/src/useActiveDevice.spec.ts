import { EventEmitter } from 'events';

import { act, renderHook } from '@testing-library/react';
import type { Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

import { useActiveDevice } from './useActiveDevice';

class FakeRoom extends EventEmitter {
	active: Partial<Record<MediaDeviceKind, string>> = {};

	getActiveDevice(kind: MediaDeviceKind) {
		return this.active[kind];
	}

	change(kind: MediaDeviceKind, deviceId: string) {
		this.active[kind] = deviceId;
		this.emit(RoomEvent.ActiveDeviceChanged, kind, deviceId);
	}
}

it('follows the device the room reports as active', () => {
	const room = new FakeRoom();
	room.active.audioinput = 'default';

	const { result } = renderHook(() => useActiveDevice(room as unknown as Room, 'audioinput'));
	expect(result.current).toBe('default');

	act(() => room.change('audioinput', 'yeti'));
	expect(result.current).toBe('yeti');
});

it('stops listening when it unmounts', () => {
	const room = new FakeRoom();

	const { unmount } = renderHook(() => useActiveDevice(room as unknown as Room, 'videoinput'));
	expect(room.listenerCount(RoomEvent.ActiveDeviceChanged)).toBe(1);

	unmount();
	expect(room.listenerCount(RoomEvent.ActiveDeviceChanged)).toBe(0);
});
