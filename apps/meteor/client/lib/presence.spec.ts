import { UserStatus } from '@rocket.chat/core-typings';

import { Presence } from './presence';

jest.mock('meteor/meteor', () => ({
	Meteor: {
		subscribe: jest.fn(),
	},
	DDPCommon: {
		parseDDP: jest.fn((msg: string) => JSON.parse(msg)),
		stringifyDDP: jest.fn((msg: unknown) => JSON.stringify(msg)),
	},
}));

const mockGet = jest.fn();

jest.mock('../../app/utils/client/lib/SDKClient', () => ({
	sdk: {
		rest: {
			get: (...args: unknown[]) => mockGet(...args),
		},
	},
}));

describe('Presence fallback status', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		Presence.store.clear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should use DISABLED as fallback when status is set to disabled', async () => {
		mockGet.mockResolvedValue({ users: [] });
		Presence.setStatus('disabled');

		Presence.listen('user1', jest.fn());
		await jest.advanceTimersByTimeAsync(500);

		expect(Presence.store.get('user1')?.status).toBe(UserStatus.DISABLED);
	});

	it('should use OFFLINE as fallback when status is set to enabled', async () => {
		mockGet.mockResolvedValue({ users: [] });
		Presence.setStatus('enabled');

		Presence.listen('user1', jest.fn());
		await jest.advanceTimersByTimeAsync(500);

		expect(Presence.store.get('user1')?.status).toBe(UserStatus.OFFLINE);
	});
});
