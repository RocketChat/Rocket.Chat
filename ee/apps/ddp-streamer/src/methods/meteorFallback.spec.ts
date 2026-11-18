import { MeteorService } from '@rocket.chat/core-services';

import { callMeteorMethod } from './meteorFallback';
import { makeSession } from '../__tests__/helpers';

jest.mock('@rocket.chat/core-services', () => ({
	MeteorService: {
		callMethodWithToken: jest.fn(),
	},
}));

const mockCallMethodWithToken = jest.mocked(MeteorService.callMethodWithToken);

describe('callMeteorMethod', () => {
	beforeEach(() => {
		mockCallMethodWithToken.mockReset();
	});

	it('calls the Meteor method with the session credentials and returns its result', async () => {
		mockCallMethodWithToken.mockResolvedValue({ result: 'remote result' });

		await expect(callMeteorMethod(makeSession(), 'remote', ['room1', 42])).resolves.toBe('remote result');

		expect(mockCallMethodWithToken).toHaveBeenCalledWith('user1', 'token1', 'remote', ['room1', 42]);
	});

	it('calls without credentials for an anonymous session', async () => {
		mockCallMethodWithToken.mockResolvedValue({ result: undefined });
		const session = Object.assign(makeSession(), { userId: undefined, userToken: undefined });

		await expect(callMeteorMethod(session, 'public', [])).resolves.toBeUndefined();

		expect(mockCallMethodWithToken).toHaveBeenCalledWith(undefined, undefined, 'public', []);
	});

	it('propagates a rejection from the Meteor service', async () => {
		const error = new Error('remote failure');
		mockCallMethodWithToken.mockRejectedValue(error);

		await expect(callMeteorMethod(makeSession(), 'failing', [])).rejects.toBe(error);
	});
});
