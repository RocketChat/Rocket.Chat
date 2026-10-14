import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike, Mocked } from 'jest-mock';

import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let useMediaCallAction: (typeof import('@rocket.chat/ui-voip'))['useMediaCallAction'];
let useMediaCallRoomAction: (typeof import('./useMediaCallRoomAction'))['useMediaCallRoomAction'];
let FakeRoomProvider: (typeof import('../../../tests/mocks/client/FakeRoomProvider'))['default'];
let useMediaCallActionMocked: Mocked<typeof useMediaCallAction>;

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const getUserInfoMocked = fn<FunctionLike>().mockResolvedValue({ user: createFakeUser({ _id: 'peer-uid', username: 'peer-username' }) });

const appRoot = (
	overrides: { user?: IUser | null; room?: IRoom; subscription?: SubscriptionWithRoom; settings?: Record<string, unknown> } = {},
) => {
	const {
		user = createFakeUser({ _id: 'own-uid', username: 'own-username' }),
		room = createFakeRoom({ uids: ['own-uid', 'peer-uid'] }),
		subscription = createFakeSubscription(),
		settings = {},
	} = overrides;

	const root = mockAppRoot()
		.withRoom(room)
		.withEndpoint('GET', '/v1/users.info', getUserInfoMocked)
		.wrap((children) => (
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				{children}
			</FakeRoomProvider>
		));

	for (const [key, value] of Object.entries(settings)) {
		root.withSetting(key as any, value as any);
	}

	if (user !== null) {
		root.withUser(user);
	}

	return root.build();
};

describe('useMediaCallRoomAction', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),
				useUserAvatarPath: fn<FunctionLike>(() => (_args: any) => 'avatar-url'),
			},
		});
		mock.module(require.resolve('@rocket.chat/ui-voip'), {
			exports: {
				useMediaCallAction: fn<FunctionLike>(),
			},
		});
		({ useMediaCallAction } = require('@rocket.chat/ui-voip'));
		({ useMediaCallRoomAction } = require('./useMediaCallRoomAction'));
		({ default: FakeRoomProvider } = require('../../../tests/mocks/client/FakeRoomProvider'));
		useMediaCallActionMocked = mocked(useMediaCallAction);
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mocker.clearAllMocks();

		useMediaCallActionMocked.mockReturnValue({
			action: fn<FunctionLike>(),
			title: 'Start_call',
			icon: 'phone',
		});
	});

	it('should return undefined if ownUserId is not defined', () => {
		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot({ user: null }),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if there are no other users in the room', () => {
		const fakeRoom = createFakeRoom({ uids: ['own-uid'] });
		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot({ room: fakeRoom }),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if there are more than one other user (Group DM)', () => {
		const fakeRoom = createFakeRoom({ uids: ['own-uid', 'peer-uid-1', 'peer-uid-2'] });
		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot({ room: fakeRoom }),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if callAction is undefined', () => {
		useMediaCallActionMocked.mockReturnValue(undefined);

		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot(),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if subscription is blocked', () => {
		const fakeBlockedSubscription = createFakeSubscription({ blocker: false, blocked: true });
		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot({ subscription: fakeBlockedSubscription }),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if subscription is blocker', () => {
		const fakeBlockedSubscription = createFakeSubscription({ blocked: false, blocker: true });
		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot({ subscription: fakeBlockedSubscription }),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return undefined if room is federated', () => {
		const fakeFederatedRoom = createFakeRoom({ uids: ['own-uid', 'peer-uid'], federated: true });
		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot({ room: fakeFederatedRoom }),
		});

		expect(result.current).toBeUndefined();
	});

	it('should return the action config if all conditions are met', () => {
		const actionMock = fn<FunctionLike>();
		useMediaCallActionMocked.mockReturnValue({
			action: actionMock,
			title: 'Start_call',
			icon: 'phone',
		});

		const { result } = renderHook(() => useMediaCallRoomAction(), {
			wrapper: appRoot(),
		});

		expect(result.current).toEqual({
			id: 'start-voice-call',
			title: 'Start_call',
			icon: 'phone',
			featured: true,
			action: expect.any(Function),
			groups: ['direct'],
		});

		// Test the action trigger
		act(() => result.current?.action?.());
		expect(actionMock).toHaveBeenCalled();
	});

	describe('SIP routing for internal calls (DMV-62)', () => {
		const SIP_ENABLED_SETTING = 'VoIP_TeamCollab_SIP_Integration_Enabled';
		const SIP_ROUTING_SETTING = 'VoIP_TeamCollab_SIP_Integration_For_Internal_Calls';

		it('should return undefined when SIP routing is enabled and the peer has no extension', async () => {
			getUserInfoMocked.mockResolvedValue({ user: createFakeUser({ _id: 'peer-uid', username: 'peer-username' }) });

			const { result } = renderHook(() => useMediaCallRoomAction(), {
				wrapper: appRoot({ settings: { [SIP_ENABLED_SETTING]: true, [SIP_ROUTING_SETTING]: true } }),
			});

			// The peer never gains an extension, so the action must stay hidden.
			await waitFor(() => expect(result.current).toBeUndefined());
		});

		it('should return the action when SIP routing is enabled and the peer has an extension', async () => {
			getUserInfoMocked.mockResolvedValue({
				user: createFakeUser({ _id: 'peer-uid', username: 'peer-username', freeSwitchExtension: '1001' }),
			});

			const { result } = renderHook(() => useMediaCallRoomAction(), {
				wrapper: appRoot({ settings: { [SIP_ENABLED_SETTING]: true, [SIP_ROUTING_SETTING]: true } }),
			});

			await waitFor(() => expect(result.current).toMatchObject({ id: 'start-voice-call', icon: 'phone' }));
		});

		it('should return the action when SIP routing is disabled even if the peer has no extension', async () => {
			getUserInfoMocked.mockResolvedValue({ user: createFakeUser({ _id: 'peer-uid', username: 'peer-username' }) });

			const { result } = renderHook(() => useMediaCallRoomAction(), {
				wrapper: appRoot({ settings: { [SIP_ENABLED_SETTING]: true, [SIP_ROUTING_SETTING]: false } }),
			});

			await waitFor(() => expect(result.current).toMatchObject({ id: 'start-voice-call', icon: 'phone' }));
		});
	});
});
