import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { callbacks } from '../../../../../lib/callbacks';

const findStub = sinon.stub();

proxyquire.noCallThru().load('../../../../../ee/app/livechat-enterprise/server/hooks/beforeNewRoom.ts', {
	'meteor/meteor': {
		Meteor: {
			Error,
		},
	},
	'@rocket.chat/models': {
		OmnichannelServiceLevelAgreements: {
			findOneByIdOrName: findStub,
		},
	},
});

describe('livechat.beforeRoom', () => {
	beforeEach(() => findStub.withArgs('high').resolves({ _id: 'high' }).withArgs('invalid').resolves(null));

	it('should return roomInfo with customFields when provided', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' } };
		const result = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo, customFields: extraData.customFields });
	});

	it('should throw an error when provided with an invalid sla', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' }, sla: 'invalid' };
		await expect(callbacks.run('livechat.beforeRoom', roomInfo, extraData)).to.be.rejectedWith(Error, 'error-invalid-sla');
	});

	it('should not include field in roomInfo when extraData has field other than customFields, sla', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' }, sla: 'high' };
		const result = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo, customFields: extraData.customFields, slaId: 'high' });
	});

	it('should return roomInfo with no customFields when customFields is not an object', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: 'not an object' };
		const result = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo });
	});
});
