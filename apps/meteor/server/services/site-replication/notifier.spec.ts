import type { AppliedChange } from '@rocket.chat/site-replication';

import { notifyReplicatedChanges } from './notifier';

jest.mock('@rocket.chat/core-services', () => ({ api: { broadcast: jest.fn() } }));
jest.mock('../../lib/notifyListener', () => ({
	notifyOnIntegrationChanged: jest.fn(),
	notifyOnMessageChange: jest.fn(),
	notifyOnPermissionChanged: jest.fn(),
	notifyOnRoleChanged: jest.fn(),
	notifyOnRoomChanged: jest.fn(),
	notifyOnSettingChanged: jest.fn(),
	notifyOnSubscriptionChanged: jest.fn(),
	notifyOnUserChange: jest.fn(),
}));
jest.mock('@rocket.chat/models', () => {
	const model = (name: string) => ({ getCollectionName: () => name });
	return {
		Integrations: model('rocketchat_integrations'),
		Messages: model('rocketchat_message'),
		Permissions: model('rocketchat_permissions'),
		Roles: model('rocketchat_roles'),
		Rooms: model('rocketchat_room'),
		Settings: model('rocketchat_settings'),
		Subscriptions: model('rocketchat_subscription'),
		Users: model('users'),
	};
});

const notify = jest.requireMock<Record<string, jest.Mock>>('../../lib/notifyListener');
const { broadcast } = jest.requireMock<{ api: { broadcast: jest.Mock } }>('@rocket.chat/core-services').api;

describe('notifyReplicatedChanges', () => {
	beforeEach(() => jest.clearAllMocks());

	it('publishes a replicated message like a locally sent one', async () => {
		const doc = { _id: 'm1', rid: 'r1', msg: 'hi' };
		await notifyReplicatedChanges([{ coll: 'rocketchat_message', id: 'm1', action: 'inserted', doc }]);
		expect(notify.notifyOnMessageChange).toHaveBeenCalledWith({ id: 'm1', data: doc });
	});

	it('tells the room a replicated message was deleted', async () => {
		await notifyReplicatedChanges([{ coll: 'rocketchat_message', id: 'm1', action: 'removed', before: { _id: 'm1', rid: 'r1' } }]);
		expect(broadcast).toHaveBeenCalledWith('notify.deleteMessage', 'r1', { _id: 'm1' });
	});

	it('publishes user updates as a diff without credentials', async () => {
		const change: AppliedChange = {
			coll: 'users',
			id: 'u1',
			action: 'updated',
			doc: { _id: 'u1' },
			set: [
				['status', 'online'],
				['services.resume.loginTokens', []],
			],
			unset: ['statusText'],
		};
		await notifyReplicatedChanges([change]);
		expect(notify.notifyOnUserChange).toHaveBeenCalledWith({
			clientAction: 'updated',
			id: 'u1',
			diff: { status: 'online' },
			unset: { statusText: 1 },
		});
	});

	it('updates every server cache that holds settings, rooms and subscriptions', async () => {
		await notifyReplicatedChanges([
			{ coll: 'rocketchat_settings', id: 's1', action: 'updated', doc: { _id: 's1', value: 1 } },
			{ coll: 'rocketchat_room', id: 'r1', action: 'inserted', doc: { _id: 'r1' } },
			{ coll: 'rocketchat_subscription', id: 'sub1', action: 'removed', before: { _id: 'sub1' } },
		]);
		expect(notify.notifyOnSettingChanged).toHaveBeenCalledWith({ _id: 's1', value: 1 }, 'updated');
		expect(notify.notifyOnRoomChanged).toHaveBeenCalledWith({ _id: 'r1' }, 'inserted');
		expect(notify.notifyOnSubscriptionChanged).toHaveBeenCalledWith({ _id: 'sub1' }, 'removed');
	});
});
