import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessage } from '../../../../../mocks/data';

const modelsMock = {
	Users: {
		isUserInRole: sinon.stub(),
	},
};

const { isMessageFromBot } = p.noCallThru().load('../../../../../../app/livechat/server/lib/isMessageFromBot', {
	'@rocket.chat/models': modelsMock,
});

describe('isMessageFromBot', () => {
	const mockMessage = createFakeMessage();

	beforeEach(() => {
		modelsMock.Users.isUserInRole.reset();
	});

	it('Should return true if user has bot role', async () => {
		modelsMock.Users.isUserInRole.resolves(true);
		const result = await isMessageFromBot(mockMessage);
		expect(result).to.be.true;
	});

	it('Should return false if user does not have bot role', async () => {
		modelsMock.Users.isUserInRole.resolves(false);
		const result = await isMessageFromBot(mockMessage);
		expect(result).to.be.false;
	});
});
