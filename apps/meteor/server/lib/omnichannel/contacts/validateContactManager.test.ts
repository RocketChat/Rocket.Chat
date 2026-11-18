import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { validateContactManager } from './validateContactManager';

const modelsMock = {
	Users: {
		findOneAgentById: sinon.stub(),
	},
};

describe('validateContactManager', () => {
	before(() => {
		mockModel('Users', modelsMock.Users);
	});

	beforeEach(() => {
		modelsMock.Users.findOneAgentById.reset();
	});

	it('should throw an error if the user does not exist', async () => {
		modelsMock.Users.findOneAgentById.resolves(undefined);
		await expect(validateContactManager('any_id')).to.be.rejectedWith('error-contact-manager-not-found');
	});

	it('should not throw an error if the user has the "livechat-agent" role', async () => {
		const user = { _id: 'userId' };
		modelsMock.Users.findOneAgentById.resolves(user);

		await expect(validateContactManager('userId')).to.not.be.rejected;
		expect(modelsMock.Users.findOneAgentById.getCall(0).firstArg).to.be.equal('userId');
	});
});
