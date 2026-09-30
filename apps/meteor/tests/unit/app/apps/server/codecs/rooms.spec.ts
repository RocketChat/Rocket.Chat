import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import * as z from 'zod';

const sandbox = sinon.createSandbox();

let visitor: Record<string, unknown> | undefined;

const models = {
	LivechatVisitors: { findOneEnabledById: async () => visitor },
	LivechatDepartment: { findOneById: sandbox.stub() },
	Users: { findOneById: sandbox.stub() },
	LivechatContacts: { findOneEnabledById: sandbox.stub() },
};

const { appRoomToRocketChat, decodeRoomRaw, createRoomCodec } = proxyquire
	.noCallThru()
	.load('../../../../../../app/apps/server/converters/codecs/rooms', {
		'@rocket.chat/models': models,
	});

describe('decodeRoomRaw', () => {
	it('maps the agents that served and responded in the room', async () => {
		const result = (await decodeRoomRaw({
			_id: 'lc-1',
			t: 'l',
			servedBy: { _id: 'agent-1', username: 'agent', name: 'Agent' },
			responseBy: { _id: 'agent-2', username: 'responder' },
		} as any)) as Record<string, any>;

		expect(result.servedBy).to.deep.equal({ _id: 'agent-1', username: 'agent', name: 'Agent' });
		expect(result.responseBy).to.deep.equal({ _id: 'agent-2', username: 'responder' });
	});
});

describe('appRoomToRocketChat', () => {
	beforeEach(() => {
		sandbox.reset();
		visitor = { _id: 'visitor-1', username: 'guest', token: 'tok-1', status: 'online' };
		models.Users.findOneById.resolves(undefined);
		models.LivechatDepartment.findOneById.resolves(undefined);
		models.LivechatContacts.findOneEnabledById.resolves(undefined);
	});

	it('does not throw when a visitor is present but visitorChannelInfo is missing', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.include({ _id: 'visitor-1' });
		expect(result.v).to.not.have.property('lastMessageTs');
		expect(result.v).to.not.have.property('phone');
	});

	it('includes the activity when the visitor has a non-empty activity array', async () => {
		visitor = { ...visitor, activity: ['2026-09'] };

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.have.property('activity').that.deep.equals(['2026-09']);
	});

	it('omits the activity when the visitor activity is null', async () => {
		visitor = { ...visitor, activity: null };

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.not.have.property('activity');
	});

	it('omits the activity when the visitor has no activity', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.not.have.property('activity');
	});

	it('defaults the visitor status to online when the stored visitor has none', async () => {
		visitor = { _id: 'visitor-1', username: 'guest', token: 'tok-1' };

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v.status).to.equal('online');
	});

	it('does not attribute the closure to the visitor when the app room does not say who closed it', async () => {
		const result = (await appRoomToRocketChat(
			{ id: 'lc-1', type: 'l', closedBy: { id: 'someone' }, visitor: { id: 'visitor-1' } },
			false,
		)) as Record<string, any>;

		expect(result).to.not.have.property('closedBy');
	});

	it('omits the visitor when the app room references one that is no longer enabled', async () => {
		visitor = undefined;

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'gone' } }, false)) as Record<string, any>;

		expect(result).to.not.have.property('v');
	});

	it('resolves the creator against the stored user', async () => {
		models.Users.findOneById.resolves({ _id: 'owner-1', username: 'owner', name: 'Owner' });

		const result = (await appRoomToRocketChat({ id: 'c-1', type: 'c', creator: { id: 'owner-1' } }, false)) as Record<string, any>;

		expect(models.Users.findOneById.firstCall.args[0]).to.equal('owner-1');
		expect(result.u).to.deep.equal({ _id: 'owner-1', username: 'owner', name: 'Owner' });
	});

	it('omits the creator when the app room references a user that no longer exists', async () => {
		const result = (await appRoomToRocketChat({ id: 'c-1', type: 'c', creator: { id: 'gone' } }, false)) as Record<string, any>;

		expect(result).to.not.have.property('u');
	});

	it('resolves the serving agent against the stored user', async () => {
		models.Users.findOneById.resolves({ _id: 'agent-1', username: 'agent' });

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', servedBy: { id: 'agent-1' } }, false)) as Record<string, any>;

		expect(result.servedBy).to.deep.equal({ _id: 'agent-1', username: 'agent' });
	});

	it('omits the serving agent when the app room references a user that no longer exists', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', servedBy: { id: 'gone' } }, false)) as Record<string, any>;

		expect(result).to.not.have.property('servedBy');
	});

	it('omits a user closer that no longer exists', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', closer: 'user', closedBy: { id: 'gone' } }, false)) as Record<
			string,
			any
		>;

		expect(result).to.not.have.property('closedBy');
	});

	it('resolves a visitor closer from the room visitor rather than the user collection', async () => {
		const result = (await appRoomToRocketChat(
			{ id: 'lc-1', type: 'l', closer: 'visitor', closedBy: { id: 'visitor-1' }, visitor: { id: 'visitor-1' } },
			false,
		)) as Record<string, any>;

		expect(result.closedBy).to.deep.equal({ _id: 'visitor-1', username: 'guest' });
		expect(models.Users.findOneById.called).to.be.false;
	});

	it('does not invent a closer from the visitor when the app room records no closedBy', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', closer: 'visitor', visitor: { id: 'visitor-1' } }, false)) as Record<
			string,
			any
		>;

		expect(result).to.not.have.property('closedBy');
	});

	it('produces exactly the Rocket.Chat fields the app room carries, adding no undefined keys', async () => {
		const result = await appRoomToRocketChat({ id: 'c-1', type: 'c', slugifiedName: 'general' }, false);

		expect(result).to.deep.equal({ _id: 'c-1', t: 'c', name: 'general' });
	});

	it('drops the department id when the department no longer exists', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', department: { id: 'gone' } }, false)) as Record<string, any>;

		expect(result).to.not.have.property('departmentId');
	});

	it('keeps the department id when the department still exists', async () => {
		models.LivechatDepartment.findOneById.resolves({ _id: 'dep-1' });

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', department: { id: 'dep-1' } }, false)) as Record<string, any>;

		expect(models.LivechatDepartment.findOneById.firstCall.args[0]).to.equal('dep-1');
		expect(result.departmentId).to.equal('dep-1');
	});

	it('drops the contact id when the contact is no longer enabled', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', contact: { _id: 'gone' } }, false)) as Record<string, any>;

		expect(result).to.not.have.property('contactId');
	});
});

describe('createRoomCodec', () => {
	const converters = {
		users: { convertById: sandbox.stub() },
		visitors: { convertById: sandbox.stub() },
	};

	const orch = {
		getConverters: () => ({ get: (key: 'users' | 'visitors') => (converters as any)[key] }),
	} as unknown as IAppServerOrchestrator;

	it('resolves a visitor closer through the visitors converter when the room was not closed by a user', async () => {
		converters.visitors.convertById.resolves({ __converted: 'visitors' });

		const result: any = await z.decodeAsync(createRoomCodec(orch), {
			_id: 'lc-1',
			t: 'l',
			closer: 'visitor',
			closedBy: { _id: 'visitor-1' },
		} as any);

		expect(converters.visitors.convertById.calledWith('visitor-1')).to.be.true;
		expect(result.closedBy).to.deep.equal({ __converted: 'visitors' });
	});
});
