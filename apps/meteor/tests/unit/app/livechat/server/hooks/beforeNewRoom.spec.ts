import { expect } from 'chai';
import proxyquire from 'proxyquire';

import { callbacks } from '../../../../../../lib/callbacks';

proxyquire.noCallThru().load('../../../../../../ee/app/livechat-enterprise/server/hooks/beforeNewRoom.ts', {
	'meteor/meteor': {
		Meteor: {
			Error,
		},
	},
});

describe('livechat.beforeRoom', () => {
	it('should return roomInfo with customFields when provided', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' } };
		const result = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo, customFields: extraData.customFields });
	});
});
