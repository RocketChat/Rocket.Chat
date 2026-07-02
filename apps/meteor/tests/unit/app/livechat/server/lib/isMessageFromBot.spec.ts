import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

import { createFakeMessage } from '../../../../../mocks/data';

const { modelsMock } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		modelsMock: {
			Users: {
				isUserInRole: sinon.stub(),
			},
		},
	};
});

vi.mock('@rocket.chat/models', () => modelsMock);

const { isMessageFromBot } = await import('../../../../../../app/livechat/server/lib/isMessageFromBot');

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
