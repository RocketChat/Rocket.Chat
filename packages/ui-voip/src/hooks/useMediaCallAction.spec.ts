import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import type { PeerInfo } from '../context';
import { useMediaCallAction } from './useMediaCallAction';

const toggleWidgetMock = jest.fn();
const endCallMock = jest.fn();

const usePeekMediaSessionStateMock = jest.fn();
const usePeekMediaSessionPeerInfoMock = jest.fn();

jest.mock('../context/useWidgetExternalControls', () => ({
	useWidgetExternalControls: jest.fn().mockReturnValue({
		toggleWidget: (...args: unknown[]) => toggleWidgetMock(...args),
		endCall: () => endCallMock(),
	}),
}));

jest.mock('../context/usePeekMediaSessionState', () => ({
	usePeekMediaSessionState: () => usePeekMediaSessionStateMock(),
}));

jest.mock('../context/usePeekMediaSessionPeerInfo', () => ({
	usePeekMediaSessionPeerInfo: () => usePeekMediaSessionPeerInfoMock(),
}));

const createWrapper = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			Voice_call__user__hangup: 'Hang up call with {{user}}',
			Voice_call__user__cancel: 'Cancel call with {{user}}',
			Voice_call__user__reject: 'Reject call from {{user}}',
			Voice_call__user_: 'Voice call {{user}}',
			New_voice_call: 'New voice call',
		})
		.build();

describe('useMediaCallAction', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePeekMediaSessionStateMock.mockReturnValue('available');
		usePeekMediaSessionPeerInfoMock.mockReturnValue(undefined);
	});

	it('returns undefined when state is unavailable', () => {
		usePeekMediaSessionStateMock.mockReturnValue('unavailable');

		const { result } = renderHook(() => useMediaCallAction(), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBeUndefined();
	});

	describe('when state is ongoing and peerInfo is set', () => {
		beforeEach(() => {
			usePeekMediaSessionStateMock.mockReturnValue('ongoing');
			usePeekMediaSessionPeerInfoMock.mockReturnValue({ displayName: 'Alice', userId: 'alice-id' });
		});

		it('returns hangup action with displayName in title', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current).toEqual({
				title: 'Hang up call with Alice',
				icon: 'phone-off',
				action: expect.any(Function),
			});
		});

		it('calls endCall when action is invoked', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current?.action();
			});

			expect(endCallMock).toHaveBeenCalledTimes(1);
		});

		it('uses number when peerInfo has no displayName (external peer)', () => {
			usePeekMediaSessionPeerInfoMock.mockReturnValue({ number: '+5511999999999' });

			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current?.title).toBe('Hang up call with +5511999999999');
		});
	});

	describe('when state is calling and peerInfo is set', () => {
		beforeEach(() => {
			usePeekMediaSessionStateMock.mockReturnValue('calling');
			usePeekMediaSessionPeerInfoMock.mockReturnValue({ displayName: 'Bob', userId: 'bob-id' });
		});

		it('returns cancel action with displayName in title', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current).toEqual({
				title: 'Cancel call with Bob',
				icon: 'phone-off',
				action: expect.any(Function),
			});
		});

		it('calls endCall when action is invoked', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current?.action();
			});

			expect(endCallMock).toHaveBeenCalledTimes(1);
		});

		it('uses number when peerInfo has no displayName (external peer)', () => {
			usePeekMediaSessionPeerInfoMock.mockReturnValue({ number: '+5511999999999' });

			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current?.title).toBe('Cancel call with +5511999999999');
		});
	});

	describe('when state is ringing and peerInfo is set', () => {
		beforeEach(() => {
			usePeekMediaSessionStateMock.mockReturnValue('ringing');
			usePeekMediaSessionPeerInfoMock.mockReturnValue({ displayName: 'Carol', userId: 'carol-id' });
		});

		it('returns reject action with displayName in title', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current).toEqual({
				title: 'Reject call from Carol',
				icon: 'phone-off',
				action: expect.any(Function),
			});
		});

		it('calls endCall when action is invoked', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current?.action();
			});

			expect(endCallMock).toHaveBeenCalledTimes(1);
		});

		it('uses number when peerInfo has no displayName (external peer)', () => {
			usePeekMediaSessionPeerInfoMock.mockReturnValue({ number: '+5511999999999' });

			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current?.title).toBe('Reject call from +5511999999999');
		});
	});

	describe('when callee is provided (available state)', () => {
		it('returns voice call action with callee displayName in title', () => {
			const callee: PeerInfo = { displayName: 'Dave', userId: 'dave-id' };

			const { result } = renderHook(() => useMediaCallAction(callee), {
				wrapper: createWrapper(),
			});

			expect(result.current).toEqual({
				title: 'Voice call Dave',
				icon: 'phone',
				action: expect.any(Function),
			});
		});

		it('calls toggleWidget with callee when action is invoked', () => {
			const callee: PeerInfo = { displayName: 'Dave', userId: 'dave-id' };

			const { result } = renderHook(() => useMediaCallAction(callee), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current?.action(callee);
			});

			expect(toggleWidgetMock).toHaveBeenCalledWith(callee);
		});

		it('uses number when callee has no displayName (external peer)', () => {
			const callee: PeerInfo = { number: '+5511888888888' };

			const { result } = renderHook(() => useMediaCallAction(callee), {
				wrapper: createWrapper(),
			});

			expect(result.current?.title).toBe('Voice call +5511888888888');
		});
	});

	describe('when no active call and no callee (default)', () => {
		it('returns new voice call action', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			expect(result.current).toEqual({
				title: 'New voice call',
				icon: 'dialpad',
				action: expect.any(Function),
			});
		});

		it('calls toggleWidget with undefined when action is invoked', () => {
			const { result } = renderHook(() => useMediaCallAction(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current?.action();
			});

			expect(toggleWidgetMock).toHaveBeenCalledWith(undefined);
		});
	});
});
