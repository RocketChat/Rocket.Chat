import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { isMessageFromBot } from './isMessageFromBot';
import { createFakeMessage } from '../../../tests/mocks/data';

const modelsMock = {
	Users: {
		isUserInRole: sinon.stub(),
	},
};

describe('isMessageFromBot', () => {
	const mockMessage = createFakeMessage();

	before(() => {
		mockModel('Users', modelsMock.Users);
	});

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
