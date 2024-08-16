import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { callbacks } from '../../../../../lib/callbacks';

proxyquire.noCallThru().load('../../../../../ee/app/livechat-enterprise/server/hooks/beforeNewRoom.ts', {
	'meteor/meteor': {
		Meteor: {
			Error,
		},
	},
	'@rocket.chat/models': {
		OmnichannelServiceLevelAgreements: {
			findOneByIdOrName: sinon.stub().returns({ _id: 'slaId' }),
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

	it('should not include field in roomInfo when extraData has field other than customFields, sla', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' }, sla: 'high' };
		const result = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo, customFields: extraData.customFields, slaId: 'slaId' });
	});

	it('should return roomInfo with empty customFields when customFields is not an object', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: 'not an object' };
		const result = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo });
	});
});
