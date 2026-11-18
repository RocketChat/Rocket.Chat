import { isLoginTokenRefused } from './isLoginTokenRefused';

describe('isLoginTokenRefused', () => {
	it.each([
		['a refused login, which the server reports without disclosing the user', { error: 401, reason: 'User not found' }],
		['an unknown token', { error: 403, reason: "You've been logged out by the server. Please log in again." }],
		['an unknown token from the DDP streamer', { error: 403, reason: "You've been logged out by the server. Please log in again" }],
		['an expired token', { error: 403, reason: 'Your session has expired. Please log in again.' }],
		[
			'an expired token rebuilt by the service broker',
			{ error: 'Your session has expired. Please log in again. [403]', reason: 'Your session has expired. Please log in again.' },
		],
		['a deactivated user', { error: 'error-user-is-not-activated', reason: 'User is not activated' }],
		['a user without roles', { error: 'error-user-has-no-roles', reason: 'User has no roles' }],
		['an app user', { error: 'error-app-user-is-not-allowed-to-login', reason: 'App user is not allowed to login' }],
	])('treats %s as a refused token', (_, error) => {
		expect(isLoginTokenRefused(error)).toBe(true);
	});

	it.each([
		['an internal server error', { error: 500, reason: 'Internal server error' }],
		['a rate limit', { error: 'too-many-requests', reason: 'Error, too many requests. Please slow down.' }],
		['a login blocked for the IP', { error: 'error-login-blocked-for-ip', reason: 'Login has been temporarily blocked For IP' }],
		['a forbidden login from a validation hook', { error: 403, reason: 'Login forbidden' }],
		['a missing login result', new Error('No result from call to login')],
		['a connection error', new Error('Connection lost')],
		['nothing', undefined],
	])('keeps the token on %s', (_, error) => {
		expect(isLoginTokenRefused(error)).toBe(false);
	});
});
