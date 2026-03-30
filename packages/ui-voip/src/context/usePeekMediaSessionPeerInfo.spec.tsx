import { Emitter } from '@rocket.chat/emitter';
import type { CallContact } from '@rocket.chat/media-signaling';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { Signals } from './MediaCallInstanceContext';
import { MediaCallInstanceContext } from './MediaCallInstanceContext';
import { usePeekMediaSessionPeerInfo } from './usePeekMediaSessionPeerInfo';

type MockInstance = {
	getMainCall: () => { contact: CallContact } | null;
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

describe('usePeekMediaSessionPeerInfo', () => {
	it('returns undefined when instance is undefined', () => {
		const { result } = renderHook(() => usePeekMediaSessionPeerInfo(), {
			wrapper: createWrapper(undefined),
		});

		expect(result.current).toBeUndefined();
	});

	it('returns undefined when instance has no main call', () => {
		const instance: MockInstance = {
			getMainCall: () => null,
			on: () => () => undefined,
		};

		const { result } = renderHook(() => usePeekMediaSessionPeerInfo(), {
			wrapper: createWrapper(instance),
		});

		expect(result.current).toBeUndefined();
	});

	describe('when main call has a contact', () => {
		it('returns external peer info for SIP contact', () => {
			const instance: MockInstance = {
				getMainCall: () => ({
					contact: {
						type: 'sip',
						id: '+5511999999999',
					},
				}),
				on: () => () => undefined,
			};

			const { result } = renderHook(() => usePeekMediaSessionPeerInfo(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toEqual({ number: '+5511999999999' });
		});

		it('returns internal peer info for user contact', () => {
			const instance: MockInstance = {
				getMainCall: () => ({
					contact: {
						type: 'user',
						id: 'userId123',
						displayName: 'John Doe',
						username: 'johndoe',
						sipExtension: '1001',
					},
				}),
				on: () => () => undefined,
			};

			const { result } = renderHook(() => usePeekMediaSessionPeerInfo(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toEqual({
				displayName: 'John Doe',
				userId: 'userId123',
				username: 'johndoe',
				callerId: '1001',
			});
		});
	});

	describe('sessionStateChange subscription', () => {
		it('updates peer info when sessionStateChange is emitted', () => {
			const emitter = new Emitter<{ sessionStateChange: void }>();

			let mainCall: { contact: CallContact } | null = {
				contact: {
					type: 'sip',
					id: '+5511999999999',
				},
			};

			const instance: MockInstance = {
				getMainCall: () => mainCall,
				on: (event, onStoreChange) => emitter.on(event, onStoreChange),
			};

			const { result } = renderHook(() => usePeekMediaSessionPeerInfo(), {
				wrapper: createWrapper(instance),
			});

			expect(result.current).toEqual({ number: '+5511999999999' });

			act(() => {
				mainCall = null;
				emitter.emit('sessionStateChange');
			});

			expect(result.current).toBeUndefined();

			act(() => {
				mainCall = {
					contact: {
						type: 'user',
						id: 'userId456',
						displayName: 'Jane Smith',
					},
				};
				emitter.emit('sessionStateChange');
			});

			expect(result.current).toEqual({
				displayName: 'Jane Smith',
				userId: 'userId456',
				username: undefined,
				callerId: undefined,
			});
		});
	});
});
