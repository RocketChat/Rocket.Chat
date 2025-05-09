import { registerModel, BaseRaw } from '@rocket.chat/models';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import sinon from 'sinon';

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
		BeforeSaveCannedResponse.enabled = false;

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser(),
		});

		expect(message).to.have.property('msg', '{{agent.name}}');
	});

	it('should do nothing if not an omnichannel room', async () => {
		BeforeSaveCannedResponse.enabled = true;

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom(),
			user: createUser(),
		});

		expect(message).to.have.property('msg', '{{agent.name}}');
	});

	it('should do nothing if the message is from a visitor', async () => {
		BeforeSaveCannedResponse.enabled = true;

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser({ token: 'visitor-token' }),
		});

		expect(message).to.have.property('msg', '{{agent.name}}');
	});

	it('should do nothing if room is not served by an agent', async () => {
		BeforeSaveCannedResponse.enabled = true;

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', v: { _id: 'visitor' } }),
			user: createUser(),
		});

		expect(message).to.have.property('msg', '{{agent.name}}');
	});

	it('should do nothing for an empty message', async () => {
		BeforeSaveCannedResponse.enabled = true;

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage(''),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser(),
		});

		expect(message).to.have.property('msg', '');
	});

	it('should replace {{agent.name}} without finding the user from DB (sender is the agent of room)', async () => {
		BeforeSaveCannedResponse.enabled = true;

		const usersModel = new UsersModel(db as unknown as any, 'user');
		const spy = sinon.spy(usersModel, 'findOneById');

		registerModel('IUsersModel', () => usersModel);

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser({ _id: 'agent', name: 'User As Agent' }),
		});

		expect(message).to.have.property('msg', 'User As Agent');
		expect(spy.called).to.be.false;
	});

	it('should replace {{agent.name}} when canned response is enabled', async () => {
		BeforeSaveCannedResponse.enabled = true;

		const usersModel = new UsersModel(db as unknown as any, 'user');
		const spy = sinon.spy(usersModel, 'findOneById');

		registerModel('IUsersModel', () => usersModel);

		const canned = new BeforeSaveCannedResponse();

		const message = await canned.replacePlaceholders({
			message: createMessage('{{agent.name}}'),
			room: createRoom({ t: 'l', servedBy: { _id: 'agent' }, v: { _id: 'visitor' } }),
			user: createUser(),
		});

		expect(message).to.have.property('msg', 'John Doe Agent');
		expect(spy.called).to.be.true;
	});
});
