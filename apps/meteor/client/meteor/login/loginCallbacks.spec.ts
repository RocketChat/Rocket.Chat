import './ldap';
import { loginWithSamlToken } from './saml';
import { getLoginWithMethod } from '../accounts';
import { callMethod } from '../connection';

jest.mock('../connection', () => ({ callMethod: jest.fn() }));
jest.mock('../../lib/sdk/ddpSdk', () => ({}));

beforeEach(() => {
	jest.mocked(callMethod).mockReset().mockRejectedValue(new Error('Login refused'));
});

it('sends the SAML token when the callback is omitted', async () => {
	await loginWithSamlToken('token');

	expect(callMethod).toHaveBeenCalledWith('login', { saml: true, credentialToken: 'token' });
});

it('sends the SAML token when the callback is explicitly undefined', async () => {
	await loginWithSamlToken('token', undefined);

	expect(callMethod).toHaveBeenCalledWith('login', { saml: true, credentialToken: 'token' });
});

it('passes a refused SAML login to the supplied callback', async () => {
	const error = new Error('Token refused');
	jest.mocked(callMethod).mockRejectedValueOnce(error);
	const callback = jest.fn();

	await loginWithSamlToken('token', callback);

	expect(callback.mock.calls).toEqual([[error]]);
});

it('sends both LDAP credentials when the callback is omitted', async () => {
	const login = getLoginWithMethod('loginWithLDAP');
	await Promise.resolve(login?.({ email: 'user@example.com' }, 'password'));

	expect(callMethod).toHaveBeenCalledWith('login', {
		ldap: true,
		username: { email: 'user@example.com' },
		ldapPass: 'password',
		ldapOptions: {},
	});
});

it('passes a refused LDAP login to the supplied callback', async () => {
	const error = new Error('Password refused');
	jest.mocked(callMethod).mockRejectedValueOnce(error);
	const callback = jest.fn();

	const login = getLoginWithMethod('loginWithLDAP');
	await Promise.resolve(login?.('john', 'password', callback));

	expect(callback.mock.calls).toEqual([[error]]);
});
