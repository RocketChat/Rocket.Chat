import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useUserMediaCallAction } from './useUserMediaCallAction';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../../../tests/mocks/data';

const usePeekMediaSessionStateMock = jest.fn().mockReturnValue('available');
const toggleWidgetMock = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserAvatarPath: jest.fn().mockReturnValue((_args: any) => 'avatar-url'),
	useUserCard: jest.fn().mockReturnValue({ closeUserCard: jest.fn() }),
}));

jest.mock('@rocket.chat/ui-voip', () => ({
	...jest.requireActual('@rocket.chat/ui-voip'),
	useWidgetExternalControls: jest.fn().mockReturnValue({ toggleWidget: (...args: any[]) => toggleWidgetMock(...args) }),
	usePeekMediaSessionState: () => usePeekMediaSessionStateMock(),
}));

describe('useUserMediaCallAction', () => {
	const fakeUser = createFakeUser({ _id: 'own-uid' });
	const mockRid = 'room-id';

	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		usePeekMediaSessionStateMock.mockReturnValue('available');
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
		usePeekMediaSessionStateMock.mockReturnValueOnce('unavailable');

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
		usePeekMediaSessionStateMock.mockReturnValueOnce('available');

		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid));

		act(() => result.current?.onClick());

		expect(toggleWidgetMock).toHaveBeenCalledWith({
			userId: fakeUser._id,
			displayName: fakeUser.name,
			avatarUrl: 'avatar-url',
		});
	});

	it('should be disabled if state is not closed, new, or unlicensed', () => {
		usePeekMediaSessionStateMock.mockReturnValueOnce('calling');

		const { result } = renderHook(() => useUserMediaCallAction(fakeUser, mockRid));

		expect(result.current?.disabled).toBe(true);
	});
});
