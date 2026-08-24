import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';

const { appRoomToRocketChat } = proxyquire.noCallThru().load('../../../../../../app/apps/server/converters/codecs/rooms', {
	'@rocket.chat/models': {
		LivechatVisitors: {
			findOneEnabledById: async () => ({ _id: 'visitor-1', username: 'guest', token: 'tok-1', status: 'online' }),
		},
		LivechatDepartment: { findOneById: async () => undefined },
		Users: { findOneById: async () => undefined },
		LivechatContacts: { findOneEnabledById: async () => undefined },
	},
});

describe('appRoomToRocketChat', () => {
	it('does not throw when a visitor is present but visitorChannelInfo is missing', async () => {
		const result = (await appRoomToRocketChat({ id: 'lc-1', type: 'l', visitor: { id: 'visitor-1' } }, false)) as Record<string, any>;

		expect(result.v).to.include({ _id: 'visitor-1' });
		expect(result.v).to.not.have.property('lastMessageTs');
		expect(result.v).to.not.have.property('phone');
	});
});
