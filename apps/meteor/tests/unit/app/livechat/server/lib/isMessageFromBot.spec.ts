import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessage, createFakeUser } from '../../../../../mocks/data';

const modelsMock = {
	Users: {
		findOneById: sinon.stub(),
	},
};

const { isMessageFromBot } = p.noCallThru().load('../../../../../../app/livechat/server/lib/isMessageFromBot', {
	'@rocket.chat/models': modelsMock,
});

describe('isMessageFromBot', () => {
	const mockUser = createFakeUser({ roles: ['bot'] });
	const mockMessage = createFakeMessage();

	beforeEach(() => {
		modelsMock.Users.findOneById.reset();
	});

	it('Should return true if user has bot role', async () => {
		modelsMock.Users.findOneById.resolves(mockUser);
		const result = await isMessageFromBot(mockMessage);
		expect(result).to.be.true;
	});

	it('Should return false if user does not have bot role', async () => {
		mockUser.roles = ['user'];
		modelsMock.Users.findOneById.resolves(mockUser);
		const result = await isMessageFromBot(mockMessage);
		expect(result).to.be.false;
	});

	it('Should throw error when user is not found', async () => {
		modelsMock.Users.findOneById.resolves(null);

		await expect(isMessageFromBot(mockMessage)).to.be.rejectedWith(Error, 'User not found');
	});
});
