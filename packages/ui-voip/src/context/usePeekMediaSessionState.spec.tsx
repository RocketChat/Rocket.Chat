import { Emitter } from '@rocket.chat/emitter';
import type { CallRole, CallState } from '@rocket.chat/media-signaling';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { Signals } from './MediaCallInstanceContext';
import { MediaCallInstanceContext } from './MediaCallInstanceContext';
import { usePeekMediaSessionState } from './usePeekMediaSessionState';

type MockInstance = {
	getMainCall: () => { state: CallState; role: CallRole } | null;
	on: (event: 'sessionStateChange', onStoreChange: () => void) => () => void;
};

const createWrapper = (instance: MockInstance | undefined) => {
	const wrapper = ({ children }: { children?: ReactNode }) => (
		<MediaCallInstanceContext.Provider
			value={{
				inRoomView: false,
				setInRoomView: () => undefined,
				instance: instance as any,
				signalEmitter: new Emitter<Signals>(),
				audioElement: undefined,
				openRoomId: undefined,
				setOpenRoomId: () => undefined,
				getAutocompleteOptions: () => Promise.resolve([]),
			}}
		>
			{children}
		</MediaCallInstanceContext.Provider>
	);
	return wrapper;
};

describe('usePeekMediaSessionState', () => {
	it('returns "unavailable" when instance is undefined', () => {
		const { result } = renderHook(() => usePeekMediaSessionState(), {
			wrapper: createWrapper(undefined),
		});

		expect(result.current).toBe('unavailable');
	});

	it('returns "available" when instance has no main call', () => {
		const instance: MockInstance = {
			getMainCall: () => null,
			on: () => () => undefined,
		};

		const { result } = renderHook(() => usePeekMediaSessionState(), {
			wrapper: createWrapper(instance),
		});

		expect(result.current).toBe('available');
	});

	it('returns "available" when main call state does not map to a widget state (e.g. hangup)', () => {
		const instance: MockInstance = {
			getMainCall: () => ({ state: 'hangup', role: 'caller' }),
			on: () => () => undefined,
		};

		const { result } = renderHook(() => usePeekMediaSessionState(), {
			wrapper: createWrapper(instance),
		});

		expect(result.current).toBe('available');
	});

	describe('when main call maps to a widget state', () => {
		it.each([
			['active', 'caller', 'ongoing'] as const,
			['active', 'callee', 'ongoing'] as const,
			['accepted', 'caller', 'ongoing'] as const,
			['renegotiating', 'callee', 'ongoing'] as const,
		])('returns "ongoing" for state "%s" and role "%s"', (callState, role, expected) => {
			const instance: MockInstance = {
				getMainCall: () => ({ state: callState, role }),
				on: () => () => undefined,
			};

			const { result } = renderHook(() => usePeekMediaSessionState(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toBe(expected);
		});

		it.each(['ringing', 'none'] as const)('returns "ringing" for callee when state is "%s"', (state) => {
			const instance: MockInstance = {
				getMainCall: () => ({ state, role: 'callee' }),
				on: () => () => undefined,
			};

			const { result } = renderHook(() => usePeekMediaSessionState(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toBe('ringing');
		});

		it.each(['ringing', 'none'] as const)('returns "calling" for caller when state is "%s"', (state) => {
			const instance: MockInstance = {
				getMainCall: () => ({ state, role: 'caller' }),
				on: () => () => undefined,
			};

			const { result } = renderHook(() => usePeekMediaSessionState(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toBe('calling');
		});
	});

	describe('sessionStateChange subscription', () => {
		it('updates state when sessionStateChange is emitted', () => {
			const emitter = new Emitter<{ sessionStateChange: void }>();
			let mainCall: { state: CallState; role: CallRole } | null = {
				state: 'active',
				role: 'caller',
			};

			const instance: MockInstance = {
				getMainCall: () => mainCall,
				on: (event, onStoreChange) => emitter.on(event, onStoreChange),
			};

			const { result } = renderHook(() => usePeekMediaSessionState(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toBe('ongoing');

			act(() => {
				mainCall = null;
				emitter.emit('sessionStateChange');
			});

			expect(result.current).toBe('available');

			act(() => {
				mainCall = { state: 'ringing', role: 'callee' };
				emitter.emit('sessionStateChange');
			});

			expect(result.current).toBe('ringing');
		});
	});
});
