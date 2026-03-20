import { Emitter } from '@rocket.chat/emitter';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useMediaCallOpenRoomTracker } from './useMediaCallOpenRoomTracker';
import type { Signals } from '../context/MediaCallInstanceContext';
import { MediaCallInstanceContext } from '../context/MediaCallInstanceContext';

const setOpenRoomIdMock = jest.fn();

const createWrapper = () => {
	const wrapper = ({ children }: { children?: ReactNode }) => (
		<MediaCallInstanceContext.Provider
			value={{
				inRoomView: false,
				setInRoomView: () => undefined,
				instance: undefined,
				signalEmitter: new Emitter<Signals>(),
				audioElement: undefined,
				openRoomId: undefined,
				setOpenRoomId: setOpenRoomIdMock,
				getAutocompleteOptions: () => Promise.resolve([]),
			}}
		>
			{children}
		</MediaCallInstanceContext.Provider>
	);
	return wrapper;
};

describe('useMediaCallOpenRoomTracker', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls setOpenRoomId with openRoomId on mount', () => {
		renderHook(() => useMediaCallOpenRoomTracker('room-123'), {
			wrapper: createWrapper(),
		});

		expect(setOpenRoomIdMock).toHaveBeenCalledTimes(1);
		expect(setOpenRoomIdMock).toHaveBeenCalledWith('room-123');
	});

	it('calls setOpenRoomId with undefined when openRoomId is undefined', () => {
		renderHook(() => useMediaCallOpenRoomTracker(undefined), {
			wrapper: createWrapper(),
		});

		expect(setOpenRoomIdMock).toHaveBeenCalledTimes(1);
		expect(setOpenRoomIdMock).toHaveBeenCalledWith(undefined);
	});

	it('calls setOpenRoomId with undefined on unmount (cleanup)', () => {
		const { unmount } = renderHook(() => useMediaCallOpenRoomTracker('room-456'), {
			wrapper: createWrapper(),
		});

		setOpenRoomIdMock.mockClear();
		unmount();

		expect(setOpenRoomIdMock).toHaveBeenCalledTimes(1);
		expect(setOpenRoomIdMock).toHaveBeenCalledWith(undefined);
	});

	it('calls setOpenRoomId with new openRoomId when openRoomId changes', () => {
		const { rerender } = renderHook(({ openRoomId }) => useMediaCallOpenRoomTracker(openRoomId), {
			wrapper: createWrapper(),
			initialProps: { openRoomId: 'room-first' as string | undefined },
		});

		expect(setOpenRoomIdMock).toHaveBeenCalledWith('room-first');

		rerender({ openRoomId: 'room-second' });

		expect(setOpenRoomIdMock).toHaveBeenLastCalledWith('room-second');
	});
});
