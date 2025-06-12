import 'reflect-metadata';
import {
	describe,
	it,
	beforeEach,
	afterEach,
	expect,
	spyOn,
	mock,
} from 'bun:test';
import { FederationRequestService } from './federation-request.service';
import { FederationConfigService } from './federation-config.service';
import * as nacl from 'tweetnacl';
import * as discovery from '../../helpers/server-discovery/discovery';
import * as authentication from '../../authentication';
import * as signJson from '../../signJson';
import * as url from '../../helpers/url';

describe('FederationRequestService', () => {
	let service: FederationRequestService;
	let configService: FederationConfigService;
	let originalFetch: typeof globalThis.fetch;

	const mockServerName = 'example.com';
	const mockSigningKey = 'aGVsbG93b3JsZA==';
	const mockSigningKeyId = 'ed25519:1';

	const mockKeyPair = {
		publicKey: new Uint8Array([1, 2, 3]),
		secretKey: new Uint8Array([4, 5, 6]),
	};

	const mockDiscoveryResult = {
		address: 'target.example.com',
		headers: {
			Host: 'target.example.com',
			'X-Custom-Header': 'Test',
		},
	};

	const mockSignature = new Uint8Array([7, 8, 9]);

	const mockSignedJson = {
		content: 'test',
		signatures: {
			'example.com': {
				'ed25519:1': 'abcdef',
			},
		},
	};

	const mockAuthHeaders =
		'X-Matrix origin="example.com",destination="target.example.com",key="ed25519:1",sig="xyz123"';

	beforeEach(() => {
		originalFetch = globalThis.fetch;

		spyOn(nacl.sign.keyPair, 'fromSecretKey').mockReturnValue(mockKeyPair);
		spyOn(nacl.sign, 'detached').mockReturnValue(mockSignature);

		spyOn(discovery, 'resolveHostAddressByServerName').mockResolvedValue(
			mockDiscoveryResult,
		);
		spyOn(url, 'extractURIfromURL').mockReturnValue('/test/path?query=value');
		spyOn(authentication, 'authorizationHeaders').mockResolvedValue(
			mockAuthHeaders,
		);
		spyOn(signJson, 'signJson').mockResolvedValue(mockSignedJson);
		spyOn(authentication, 'computeAndMergeHash').mockImplementation(
			(obj: any) => obj,
		);

		globalThis.fetch = Object.assign(
			async (_url: string, _options?: RequestInit) => {
				return {
					ok: true,
					status: 200,
					json: async () => ({ result: 'success' }),
					text: async () => '{"result":"success"}',
				} as Response;
			},
			{ preconnect: () => {} },
		) as typeof fetch;

		configService = {
			serverName: mockServerName,
			signingKey: mockSigningKey,
			signingKeyId: mockSigningKeyId,
		} as FederationConfigService;

		service = new FederationRequestService(configService);
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		mock.restore();
	});

	describe('makeSignedRequest', () => {
		it('should make a successful signed request without body', async () => {
			const fetchSpy = spyOn(globalThis, 'fetch');

			const result = await service.makeSignedRequest({
				method: 'GET',
				domain: 'target.example.com',
				uri: '/test/path',
			});

			expect(configService.serverName).toBe(mockServerName);
			expect(configService.signingKey).toBe(mockSigningKey);
			expect(configService.signingKeyId).toBe(mockSigningKeyId);

			expect(nacl.sign.keyPair.fromSecretKey).toHaveBeenCalled();

			expect(discovery.resolveHostAddressByServerName).toHaveBeenCalledWith(
				'target.example.com',
				mockServerName,
			);

			expect(fetchSpy).toHaveBeenCalledWith(
				'https://target.example.com/test/path',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: mockAuthHeaders,
						'X-Custom-Header': 'Test',
					}),
				}),
			);

			expect(result).toEqual({ result: 'success' });
		});

		it('should make a successful signed request with body', async () => {
			const fetchSpy = spyOn(globalThis, 'fetch');

			const mockBody = { key: 'value' };

			const result = await service.makeSignedRequest({
				method: 'POST',
				domain: 'target.example.com',
				uri: '/test/path',
				body: mockBody,
			});

			expect(signJson.signJson).toHaveBeenCalledWith(
				expect.objectContaining({ key: 'value', signatures: {} }),
				expect.any(Object),
				mockServerName,
			);

			expect(authentication.authorizationHeaders).toHaveBeenCalledWith(
				mockServerName,
				expect.any(Object),
				'target.example.com',
				'POST',
				'/test/path?query=value',
				mockSignedJson,
			);

			expect(fetchSpy).toHaveBeenCalledWith(
				'https://target.example.com/test/path',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(mockSignedJson),
				}),
			);

			expect(result).toEqual({ result: 'success' });
		});

		it('should make a signed request with query parameters', async () => {
			const fetchSpy = spyOn(globalThis, 'fetch');

			const result = await service.makeSignedRequest({
				method: 'GET',
				domain: 'target.example.com',
				uri: '/test/path',
				queryString: 'param1=value1&param2=value2',
			});

			expect(fetchSpy).toHaveBeenCalledWith(
				'https://target.example.com/test/path?param1=value1&param2=value2',
				expect.any(Object),
			);

			expect(result).toEqual({ result: 'success' });
		});

		it('should handle fetch errors properly', async () => {
			globalThis.fetch = Object.assign(
				async () => {
					return {
						ok: false,
						status: 404,
						text: async () => 'Not Found',
					} as Response;
				},
				{ preconnect: () => {} },
			) as typeof fetch;

			try {
				await service.makeSignedRequest({
					method: 'GET',
					domain: 'target.example.com',
					uri: '/test/path',
				});
			} catch (error: unknown) {
				if (error instanceof Error) {
					expect(error.message).toContain(
						'Federation request failed: 404 Not Found',
					);
				} else {
					throw error;
				}
			}
		});

		it('should handle JSON error responses properly', async () => {
			globalThis.fetch = Object.assign(
				async () => {
					return {
						ok: false,
						status: 400,
						text: async () =>
							'{"error":"Bad Request","code":"M_INVALID_PARAM"}',
					} as Response;
				},
				{ preconnect: () => {} },
			) as typeof fetch;

			try {
				await service.makeSignedRequest({
					method: 'GET',
					domain: 'target.example.com',
					uri: '/test/path',
				});
			} catch (error: unknown) {
				if (error instanceof Error) {
					expect(error.message).toContain(
						'Federation request failed: 400 {"error":"Bad Request","code":"M_INVALID_PARAM"}',
					);
				} else {
					throw error;
				}
			}
		});

		it('should handle network errors properly', async () => {
			globalThis.fetch = Object.assign(
				async () => {
					throw new Error('Network Error');
				},
				{ preconnect: () => {} },
			) as typeof fetch;

			try {
				await service.makeSignedRequest({
					method: 'GET',
					domain: 'target.example.com',
					uri: '/test/path',
				});
			} catch (error: unknown) {
				if (error instanceof Error) {
					expect(error.message).toBe('Network Error');
				} else {
					throw error;
				}
			}
		});
	});

	describe('convenience methods', () => {
		it('should call makeSignedRequest with correct parameters for GET', async () => {
			const makeSignedRequestSpy = spyOn(
				service,
				'makeSignedRequest',
			).mockResolvedValue({ result: 'success' });

			await service.get('target.example.com', '/api/resource', {
				filter: 'active',
			});

			expect(makeSignedRequestSpy).toHaveBeenCalledWith({
				method: 'GET',
				domain: 'target.example.com',
				uri: '/api/resource',
				queryString: 'filter=active',
			});
		});

		it('should call makeSignedRequest with correct parameters for POST', async () => {
			const makeSignedRequestSpy = spyOn(
				service,
				'makeSignedRequest',
			).mockResolvedValue({ result: 'success' });

			const body = { data: 'example' };
			await service.post('target.example.com', '/api/resource', body, {
				version: '1',
			});

			expect(makeSignedRequestSpy).toHaveBeenCalledWith({
				method: 'POST',
				domain: 'target.example.com',
				uri: '/api/resource',
				body,
				queryString: 'version=1',
			});
		});

		it('should call makeSignedRequest with correct parameters for PUT', async () => {
			const makeSignedRequestSpy = spyOn(
				service,
				'makeSignedRequest',
			).mockResolvedValue({ result: 'success' });

			const body = { data: 'updated' };
			await service.put('target.example.com', '/api/resource/123', body);

			expect(makeSignedRequestSpy).toHaveBeenCalledWith({
				method: 'PUT',
				domain: 'target.example.com',
				uri: '/api/resource/123',
				body,
				queryString: '',
			});
		});
	});
});
