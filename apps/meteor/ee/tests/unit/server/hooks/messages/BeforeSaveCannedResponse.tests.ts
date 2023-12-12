import type { ISetting, SettingValue } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { BaseRaw } from '../../../../../../server/models/raw/BaseRaw';
import { BeforeSaveCannedResponse } from '../../../../../server/hooks/messages/BeforeSaveCannedResponse';

const createMessage = (msg?: string, extra: any = {}) => ({
	_id: 'msg-id',
	rid: 'GENERAL',
	ts: new Date(),
	u: {
		_id: 'user-id',
		username: 'user',
	},
	_updatedAt: new Date(),
	msg: msg as string,
	...extra,
});

const createRoom = (extra: any = {}) => ({
	_id: 'GENERAL',
	name: 'general',
	...extra,
});

const createUser = (extra: any = {}) => ({
	_id: 'user-id',
	name: 'User Name',
	username: 'user',
	emails: [{ address: 'user@user.com' }],
	...extra,
});

const makeGetSetting =
	(values: Record<string, any>) =>
	<T extends SettingValue = SettingValue>(id: ISetting['_id']): T => {
		return values[id];
	};

class LivechatVisitorsModel extends BaseRaw<any> {
	findOneEnabledById() {
		return {};
	}
}

class UsersModel extends BaseRaw<any> {
	async findOneById() {
		return {
			name: 'John Doe Agent',
		};
	}
}

const db = {
	collection: () => ({}),
};

describe('Omnichannel canned responses', () => {
	before(() => {
		registerModel('ILivechatVisitorsModel', () => new LivechatVisitorsModel(db as unknown as any, 'visitor'));
		registerModel('IUsersModel', () => new UsersModel(db as unknown as any, 'user'));
	});

	it('should do nothing if canned response is disabled', async () => {
		const canned = new BeforeSaveCannedResponse({
			getSetting: makeGetSetting({
				Canned_Responses_Enable: false,
			}),
		});

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser(),
		});

		return expect(message).to.have.property('msg', '{{agent.name}}');
	});

	it('should replace {{agent.name}} when canned response is enabled', async () => {
		const canned = new BeforeSaveCannedResponse({
			getSetting: makeGetSetting({
				Canned_Responses_Enable: true,
			}),
		});

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser(),
		});

		return expect(message).to.have.property('msg', 'John Doe Agent');
	});
});
