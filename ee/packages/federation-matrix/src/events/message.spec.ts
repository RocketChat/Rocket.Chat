import { FederationMatrix } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';

import { message } from './message';

jest.mock('@rocket.chat/core-services', () => ({
	FederationMatrix: {
		saveFederationMessage: jest.fn(),
	},
	Message: {},
}), { virtual: true });

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		eventEmitterService: {
			on: jest.fn(),
		},
	},
}), { virtual: true });

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		error: jest.fn(),
	})),
}), { virtual: true });

jest.mock('@rocket.chat/models', () => ({
	Users: {},
	Rooms: {},
	Messages: {},
}), { virtual: true });

jest.mock('../helpers/getThreadMessageId', () => ({
	getThreadMessageId: jest.fn(),
}));

describe('message', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('rethrows errors from saving a Matrix message', async () => {
		message();

		const on = federationSDK.eventEmitterService.on as jest.Mock;
		const messageHandler = on.mock.calls.find(([event]) => event === 'homeserver.matrix.message')?.[1];
		const error = new Error('media download failed');

		jest.mocked(FederationMatrix.saveFederationMessage).mockRejectedValue(error);

		await expect(messageHandler({})).rejects.toBe(error);
	});
});
