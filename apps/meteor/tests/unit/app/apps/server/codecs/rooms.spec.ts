import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';

let visitor: Record<string, unknown>;

const { appRoomToRocketChat } = proxyquire.noCallThru().load('../../../../../../app/apps/server/converters/codecs/rooms', {
	'@rocket.chat/models': {
		LivechatVisitors: {
			findOneEnabledById: async () => visitor,
		},
		LivechatDepartment: { findOneById: async () => undefined },
		Users: { findOneById: async () => undefined },
		LivechatContacts: { findOneEnabledById: async () => undefined },
	},
});

describe('appRoomToRocketChat', () => {
	beforeEach(() => {
		visitor = { _id: 'visitor-1', username: 'guest', token: 'tok-1', status: 'online' };
	});

	it('does not throw when a visitor is present but visitorChannelInfo is missing', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.include({ _id: 'visitor-1' });
		expect(result.v).to.not.have.property('lastMessageTs');
		expect(result.v).to.not.have.property('phone');
	});

	it('includes the activity when the visitor has a non-empty activity array', async () => {
		visitor.activity = ['2026-09'];

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.have.property('activity').that.deep.equals(['2026-09']);
	});

	it('omits the activity when the visitor activity is null', async () => {
		visitor.activity = null;

		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.not.have.property('activity');
	});

	it('omits the activity when the visitor has no activity', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.not.have.property('activity');
	});
});
