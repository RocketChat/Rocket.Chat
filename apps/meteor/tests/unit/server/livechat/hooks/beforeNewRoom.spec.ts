import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { findStub, patchStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		findStub: sinon.stub(),
		patchStub: sinon.stub(),
	};
});

vi.mock('meteor/meteor', () => ({
	Meteor: {
		Error,
	},
}));
vi.mock('@rocket.chat/models', () => ({
	OmnichannelServiceLevelAgreements: {
		findOneByIdOrName: findStub,
	},
}));
vi.mock('../../../../../app/livechat/server/lib/hooks', () => ({
	beforeNewRoom: { patch: patchStub },
}));

const { beforeNewRoomPatched } = await import('../../../../../ee/app/livechat-enterprise/server/hooks/beforeNewRoom');

describe('beforeRoom', () => {
	beforeEach(() => findStub.withArgs('high').resolves({ _id: 'high' }).withArgs('invalid').resolves(null));

	it('should return roomInfo with customFields when provided', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' } };
		const result = await beforeNewRoomPatched(undefined, roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo, customFields: extraData.customFields });
	});

	it('should throw an error when provided with an invalid sla', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' }, sla: 'invalid' };
		await expect(beforeNewRoomPatched(undefined, roomInfo, extraData)).to.be.rejectedWith(Error, 'error-invalid-sla');
	});

	it('should not include field in roomInfo when extraData has field other than customFields, sla', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: { test: 'test' }, sla: 'high' };
		const result = await beforeNewRoomPatched(undefined, roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo, customFields: extraData.customFields, slaId: 'high' });
	});

	it('should return roomInfo with no customFields when customFields is not an object', async () => {
		const roomInfo = { name: 'test' };
		const extraData = { customFields: 'not an object' };
		const result = await beforeNewRoomPatched(undefined, roomInfo, extraData);
		expect(result).to.deep.equal({ ...roomInfo });
	});
});
