import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useMediaCallContext } from '@rocket.chat/ui-voip';
import { act, renderHook } from '@testing-library/react';

import { useUserMediaCallAction } from './useUserMediaCallAction';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../../../tests/mocks/data';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserAvatarPath: jest.fn().mockReturnValue((_args: any) => 'avatar-url'),
	useUserCard: jest.fn().mockReturnValue({ closeUserCard: jest.fn() }),
}));

jest.mock('@rocket.chat/ui-voip', () => ({
	...jest.requireActual('@rocket.chat/ui-voip'),
	useMediaCallContext: jest.fn().mockImplementation(() => ({
		state: 'closed',
		onToggleWidget: jest.fn(),
	})),
}));

const useMediaCallContextMocked = jest.mocked(useMediaCallContext);

describe('useUserMediaCallAction', () => {
	const fakeUser = createFakeUser({ _id: 'own-uid' });
	const mockRid = 'room-id';

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return undefined if room is federated', () => {
		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRoom(createFakeRoom({ federated: true }))
				.build(),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if state is unauthorized', () => {
		useMediaCallContextMocked.mockReturnValueOnce({
			state: 'unauthorized',
			onToggleWidget: undefined,
			onEndCall: undefined,
			peerInfo: undefined,
		});

		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid), { wrapper: mockAppRoot().build() });
		expect(result.current).toBeUndefined();
	});

	it('should return undefined if subscription is blocked', () => {
		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRoom(createFakeRoom())
				.withSubscription(createFakeSubscription({ blocker: false, blocked: true }))
				.build(),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if subscription is blocker', () => {
		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRoom(createFakeRoom())
				.withSubscription(createFakeSubscription({ blocker: true, blocked: false }))
				.build(),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if user is own user', () => {
		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid), {
			wrapper: mockAppRoot().withUser(fakeUser).withRoom(createFakeRoom()).withSubscription(createFakeSubscription()).build(),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return action if conditions are met', () => {
		const fakeUser = createFakeUser();
		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRoom(createFakeRoom())
				.withSubscription(createFakeSubscription())
				.withTranslations('en', 'core', {
					Voice_call__user_: 'Voice call {{user}}',
				})
				.build(),
		});

		expect(result.current).toEqual(
			expect.objectContaining({
				type: 'communication',
				icon: 'phone',
				title: `Voice call ${fakeUser.name}`,
				disabled: false,
			}),
		);
	});

	it('should call onClick handler correctly', () => {
		const mockOnToggleWidget = jest.fn();
		useMediaCallContextMocked.mockReturnValueOnce({
			state: 'closed',
			onToggleWidget: mockOnToggleWidget,
			peerInfo: undefined,
			onEndCall: () => undefined,
		});

		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid));

		act(() => result.current?.onClick());

		expect(mockOnToggleWidget).toHaveBeenCalledWith({
			userId: fakeUser._id,
			displayName: fakeUser.name,
			avatarUrl: 'avatar-url',
		});
	});

	it('should be disabled if state is not closed, new, or unlicensed', () => {
		useMediaCallContextMocked.mockReturnValueOnce({
			state: 'calling',
			onToggleWidget: jest.fn(),
			peerInfo: undefined,
			onEndCall: () => undefined,
		});

		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid));

		expect(result.current?.disabled).toBe(true);
	});
});
