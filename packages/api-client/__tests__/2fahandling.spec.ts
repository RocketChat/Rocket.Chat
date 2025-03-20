import fetchMock from 'jest-fetch-mock';

import { RestClient } from '../src/index';

beforeAll(() => {
	fetchMock.enableMocks();
});

afterAll(() => {
	fetchMock.disableMocks();
});

beforeEach(() => {
	fetchMock.mockIf(/^https?:\/\/example.com.*$/, async (req) => {
		if (req.headers.get('x-2fa-code') === '2FA_CODE') {
			return {
				status: 200,
				body: JSON.stringify({
					status: 'success',
					data: {
						userId: 'foo',
						email: 'foo',
						username: 'foo',
					},
				}),
			};
		}

		if (req.headers.get('x-2fa-code') === 'WRONG_2FA_CODE') {
			return {
				status: 400,
				body: JSON.stringify({
					errorType: 'totp-invalid',
					message: 'Invalid TOTP provided',
					details: {
						method: 'totp',
					},
				}),
			};
		}

		return {
			status: 400,
			body: JSON.stringify({
				errorType: 'totp-required',
				details: {
					method: 'totp',
				},
			}),
		};
	});
	fetchMock.doMock();
});

const isResponse = (e: any): e is Response => {
	expect(e).toBeInstanceOf(Response);
	return true;
};

test('if the 2fa handler is not provided, it should throw an error', async () => {
	const client = new RestClient({
		baseUrl: 'https://example.com',
	});

	try {
		await client.post('/v1/login', { user: 'foo', username: 'foo', email: 'foo', password: 'foo', code: 'foo' });
	} catch (error) {
		if (!isResponse(error)) {
			throw error;
		}

		expect(error.status).toBe(400);

		const body = await error.json();

		expect(body).toMatchObject({
			errorType: 'totp-required',
			details: {
				method: 'totp',
			},
		});
	}
});

test('if the 2fa handler is provided, and fails if should throw the error thrown by the handler', async () => {
	const fn = jest.fn();

	const client = new RestClient({
		baseUrl: 'https://example.com',
	});

	client.handleTwoFactorChallenge((e) => {
		fn(e);

		throw new Error('foo');
	});

	await expect(client.post('/v1/login', { user: 'foo', username: 'foo', email: 'foo', password: 'foo', code: 'foo' })).rejects.toThrow(
		new Error('foo'),
	);

	expect(fn).toHaveBeenCalledTimes(1);
});

test('if the 2fa handler is provided it should resolves', async () => {
	const fn = jest.fn();

	const client = new RestClient({
		baseUrl: 'https://example.com',
	});

	client.handleTwoFactorChallenge(() => {
		fn();
		return Promise.resolve('2FA_CODE');
	});

	const result = await client.post('/v1/login', { user: 'foo', username: 'foo', email: 'foo', password: 'foo', code: 'foo' });

	expect(result).toMatchObject({
		status: 'success',
		data: {
			userId: 'foo',
			email: 'foo',
			username: 'foo',
		},
	});

	expect(fn).toHaveBeenCalledTimes(1);
});

test('should be ask for 2fa code again if the code is wrong', async () => {
	const fn = jest.fn();

	const client = new RestClient({
		baseUrl: 'https://example.com',
	});

	let retries = 0;

	client.handleTwoFactorChallenge(() => {
		fn();

		if (!retries) {
			retries++;
			return Promise.resolve('WRONG_2FA_CODE');
		}

		return Promise.resolve('2FA_CODE');
	});

	const result = await client.post('/v1/login', { user: 'foo', username: 'foo', email: 'foo', password: 'foo', code: 'foo' });

	expect(result).toMatchObject({
		status: 'success',
		data: {
			userId: 'foo',
			email: 'foo',
			username: 'foo',
		},
	});

	expect(fn).toHaveBeenCalledTimes(2);
});
