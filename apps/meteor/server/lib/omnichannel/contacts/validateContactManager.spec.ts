import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		findOneAgentById: sinon.stub(),
	},
};

const { validateContactManager } = proxyquire.noCallThru().load('./validateContactManager', {
	'@rocket.chat/models': modelsMock,
});

describe('validateContactManager', () => {
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
