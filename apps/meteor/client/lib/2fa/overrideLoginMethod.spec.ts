import { imperativeModal } from '@rocket.chat/ui-client';
import { waitFor } from '@testing-library/react';

import { handleLogin } from './overrideLoginMethod';
import { dispatchToastMessage } from '../toast';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: { open: jest.fn(), close: jest.fn() } }));
jest.mock('../toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../../lib/i18n', () => ({ t: (key: string) => key }));

beforeEach(() => jest.clearAllMocks());

it('passes the SAML token and delivers the successful result to the callback', async () => {
	const login = jest.fn<Promise<string>, [string]>().mockResolvedValue('session');
	const callback = jest.fn();

	await handleLogin(login, jest.fn())('token', callback);

	expect(login).toHaveBeenCalledWith('token');
	expect(callback.mock.calls).toEqual([[undefined, 'session']]);
});

it('preserves the SAML token when the callback is explicitly undefined', async () => {
	const login = jest.fn<Promise<string>, [string]>().mockResolvedValue('session');

	await handleLogin(login, jest.fn())('token', undefined);

	expect(login).toHaveBeenCalledWith('token');
});

it('preserves the SAML token when no callback is supplied', async () => {
	const login = jest.fn<Promise<string>, [string]>().mockResolvedValue('session');

	await handleLogin(login, jest.fn())('token');

	expect(login).toHaveBeenCalledWith('token');
});

it('preserves both LDAP credentials when no callback is supplied', async () => {
	const login = jest.fn<Promise<string>, [{ email: string }, string]>().mockResolvedValue('session');

	await handleLogin(login, jest.fn())({ email: 'user@example.com' }, 'password');

	expect(login).toHaveBeenCalledWith({ email: 'user@example.com' }, 'password');
});

it('reports an ordinary login failure to the callback without retrying', async () => {
	const error = new Error('Login refused');
	const login = jest.fn<Promise<string>, [string]>().mockRejectedValue(error);
	const retry = jest.fn();
	const callback = jest.fn();

	await handleLogin(login, retry)('token', callback);

	expect(callback.mock.calls).toEqual([[error]]);
	expect(retry).not.toHaveBeenCalled();
});

it('retries LDAP with the original credentials and submitted code before delivering the result', async () => {
	const error = Object.assign(new Error('Code required'), { error: 'totp-required', details: { method: 'totp' } });
	const login = jest.fn<Promise<string>, [string, string]>().mockRejectedValue(error);
	const retry = jest.fn().mockResolvedValue('verified session');
	const callback = jest.fn();
	const result = handleLogin(login, retry)('john', 'password', callback);

	await waitFor(() => expect(imperativeModal.open).toHaveBeenCalled());
	expect(callback).not.toHaveBeenCalled();
	await jest.mocked(imperativeModal.open).mock.calls[0][0].props?.onConfirm('123456', 'totp');
	await result;

	expect(retry).toHaveBeenCalledWith('john', 'password', '123456');
	expect(callback.mock.calls).toEqual([[undefined, 'verified session']]);
});

it('reports an invalid code via toast rather than passing the error to the callback', async () => {
	const error = Object.assign(new Error('Invalid code'), { error: 'totp-invalid' });
	const login = jest.fn<Promise<string>, [string]>().mockRejectedValue(error);
	const callback = jest.fn();

	await handleLogin(login, jest.fn())('token', callback);

	await waitFor(() => expect(callback.mock.calls).toEqual([[undefined]]));
	expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'Invalid_two_factor_code' });
});
