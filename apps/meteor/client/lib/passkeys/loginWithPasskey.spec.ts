import { startAuthentication } from '@simplewebauthn/browser';

import { loginWithPasskey } from './loginWithPasskey';
import { loginWithToken } from '../../meteor/accounts';
import { sdk } from '../SDKClient';

jest.mock('@simplewebauthn/browser', () => ({ startAuthentication: jest.fn() }));
jest.mock('../../meteor/accounts', () => ({ loginWithToken: jest.fn() }));
jest.mock('../SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));

const post = sdk.rest.post as jest.Mock;
const options = { challenge: 'challenge', rpId: 'chat.example.com' };
const credential = { id: 'credential-id' };

describe('loginWithPasskey', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		post.mockImplementation(async (path: string) =>
			path === '/v1/passkeys.generateAuthenticationOptions' ? { options } : { userId: 'user-id', authToken: 'auth-token' },
		);
		(startAuthentication as jest.Mock).mockResolvedValue(credential);
	});

	it('answers the server challenge with a passkey and resumes the session it starts', async () => {
		await loginWithPasskey();

		expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: options });
		expect(post).toHaveBeenCalledWith('/v1/passkeys.login', { credential });
		expect(loginWithToken).toHaveBeenCalledWith('auth-token');
	});

	it.each(['NotAllowedError', 'AbortError'])('reports a dismissed prompt (%s) as passkey-canceled', async (name) => {
		(startAuthentication as jest.Mock).mockRejectedValue(
			Object.assign(new Error('The operation either timed out or was not allowed'), { name }),
		);

		await expect(loginWithPasskey()).rejects.toMatchObject({ error: 'passkey-canceled' });
		expect(loginWithToken).not.toHaveBeenCalled();
	});

	it('reports a refusal with the code and message the server gave', async () => {
		post.mockImplementation(async (path: string) => {
			if (path === '/v1/passkeys.login') {
				throw Object.assign(new Error('User is not activated'), {
					errorType: 'error-user-is-not-activated',
					error: 'User is not activated',
				});
			}
			return { options };
		});

		await expect(loginWithPasskey()).rejects.toMatchObject({ error: 'error-user-is-not-activated', reason: 'User is not activated' });
		expect(loginWithToken).not.toHaveBeenCalled();
	});
});
