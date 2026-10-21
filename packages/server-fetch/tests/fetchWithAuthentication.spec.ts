import fetch from 'node-fetch';

import { buildDigestResponse } from '../src/auth/buildDigestResponse';
import { fetchWithAuthentication } from '../src/auth/fetchWithAuthentication';
import type { ExtendedFetchOptions } from '../src/types';

jest.mock('node-fetch');
jest.mock('../src/auth/buildDigestResponse');
jest.mock('../src/logger', () => ({
	logger: { error: jest.fn(), info: jest.fn() },
}));

const mockFetch = jest.mocked(fetch);
const mockBuildDigestResponse = jest.mocked(buildDigestResponse);

function makeResponse(wwwAuthenticate?: string): fetch.Response {
	return {
		headers: {
			get: (name: string) => (name === 'www-authenticate' ? (wwwAuthenticate ?? null) : null),
		},
	} as unknown as fetch.Response;
}

const BASE_URL = new URL('https://api.example.com/resource');
const BASE_REQUEST: fetch.RequestInit & { headers: Record<string, string> } = {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
};
const AUTH = { type: 'digest' as const, username: 'user', password: 'pass' };
const AUTH_HEADER = 'Digest realm="api.example.com", nonce="abc123"';
const BUILT_DIGEST = 'Digest username="user", realm="api.example.com", nonce="abc123", response="abc"';

describe('fetchWithAuthentication', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('happy path', () => {
		it('calls fetch again with the Authorization header set', async () => {
			const originalResponse = makeResponse(AUTH_HEADER);
			const authenticatedResponse = makeResponse() as fetch.Response;

			mockBuildDigestResponse.mockReturnValue(BUILT_DIGEST);
			mockFetch.mockResolvedValue(authenticatedResponse as never);

			const result = await fetchWithAuthentication(BASE_URL, BASE_REQUEST, AUTH, originalResponse);

			expect(mockBuildDigestResponse).toHaveBeenCalledWith({
				uri: '/resource',
				method: 'POST',
				username: 'user',
				password: 'pass',
				authHeader: AUTH_HEADER,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				BASE_URL.toString(),
				expect.objectContaining({
					headers: expect.objectContaining({ Authorization: BUILT_DIGEST }),
				}),
			);

			expect(result).toBe(authenticatedResponse);
		});

		it('preserves existing request headers alongside Authorization', async () => {
			const originalResponse = makeResponse(AUTH_HEADER);
			mockBuildDigestResponse.mockReturnValue(BUILT_DIGEST);
			mockFetch.mockResolvedValue(makeResponse() as never);

			await fetchWithAuthentication(BASE_URL, BASE_REQUEST, AUTH, originalResponse);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
				}),
			);
		});

		it('uses search params when the url includes it', async () => {
			const requestWithoutMethod = { headers: {} } as typeof BASE_REQUEST;
			const originalResponse = makeResponse(AUTH_HEADER);
			mockBuildDigestResponse.mockReturnValue(BUILT_DIGEST);
			mockFetch.mockResolvedValue(makeResponse() as never);

			const url = new URL('https://api.example.com/resource?param=1');

			await fetchWithAuthentication(url, requestWithoutMethod, AUTH, originalResponse);

			expect(mockBuildDigestResponse).toHaveBeenCalledWith(expect.objectContaining({ uri: '/resource?param=1' }));
		});

		it('uses only the pathname and search from the url', async () => {
			const requestWithoutMethod = { headers: {} } as typeof BASE_REQUEST;
			const originalResponse = makeResponse(AUTH_HEADER);
			mockBuildDigestResponse.mockReturnValue(BUILT_DIGEST);
			mockFetch.mockResolvedValue(makeResponse() as never);

			const url = new URL('https://api.example.com/resource?param=1#somethingExtra');

			await fetchWithAuthentication(url, requestWithoutMethod, AUTH, originalResponse);

			expect(mockBuildDigestResponse).toHaveBeenCalledWith(expect.objectContaining({ uri: '/resource?param=1' }));
		});

		it('defaults method to GET when not specified in the request', async () => {
			const requestWithoutMethod = { headers: {} } as typeof BASE_REQUEST;
			const originalResponse = makeResponse(AUTH_HEADER);
			mockBuildDigestResponse.mockReturnValue(BUILT_DIGEST);
			mockFetch.mockResolvedValue(makeResponse() as never);

			await fetchWithAuthentication(BASE_URL, requestWithoutMethod, AUTH, originalResponse);

			expect(mockBuildDigestResponse).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET' }));
		});
	});

	describe('returns original response without retrying when', () => {
		it('auth is undefined', async () => {
			const originalResponse = makeResponse(AUTH_HEADER);
			const result = await fetchWithAuthentication(BASE_URL, BASE_REQUEST, undefined, originalResponse);

			expect(mockFetch).not.toHaveBeenCalled();
			expect(result).toBe(originalResponse);
		});

		it('auth.type is not digest', async () => {
			const originalResponse = makeResponse(AUTH_HEADER);
			const result = await fetchWithAuthentication(
				BASE_URL,
				BASE_REQUEST,
				{ type: 'basic' as never, username: 'user', password: 'pass' } as ExtendedFetchOptions['auth'],
				originalResponse,
			);

			expect(mockFetch).not.toHaveBeenCalled();
			expect(result).toBe(originalResponse);
		});

		it('auth.username is missing', async () => {
			const originalResponse = makeResponse(AUTH_HEADER);

			const result = await fetchWithAuthentication(
				BASE_URL,
				BASE_REQUEST,
				{ type: 'digest', username: '', password: 'pass' } as ExtendedFetchOptions['auth'],
				originalResponse,
			);

			expect(mockFetch).not.toHaveBeenCalled();
			expect(result).toBe(originalResponse);
		});

		it('www-authenticate header is absent from the response', async () => {
			const originalResponse = makeResponse(undefined);
			const result = await fetchWithAuthentication(BASE_URL, BASE_REQUEST, AUTH, originalResponse);

			expect(mockFetch).not.toHaveBeenCalled();
			expect(result).toBe(originalResponse);
		});
	});

	describe('returns original response without retrying when buildDigestResponse throws', () => {
		it('propagates gracefully and returns the original response', async () => {
			const originalResponse = makeResponse(AUTH_HEADER);
			mockBuildDigestResponse.mockImplementation(() => {
				throw new Error('Algorithm not supported');
			});

			const result = await fetchWithAuthentication(BASE_URL, BASE_REQUEST, AUTH, originalResponse);

			expect(mockFetch).not.toHaveBeenCalled();
			expect(result).toBe(originalResponse);
		});
	});
});
