import { generateKeyPairSync, sign } from 'node:crypto';

import { serverFetch } from '@rocket.chat/server-fetch';
import { Response } from 'node-fetch';

import { handleIdentityToken } from './handleIdentityToken';

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: jest.fn(),
}));

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
	modulusLength: 2048,
});

const jwkPublicKey = publicKey.export({ format: 'jwk' });

const toBase64Url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url');

describe('handleIdentityToken', () => {
	const mockClientId = 'com.yourcompany.app';

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should throw an error if the token has the wrong audience', async () => {
		const header = toBase64Url({ alg: 'RS256', kid: 'mock-key-id' });
		const payload = toBase64Url({
			iss: 'https://appleid.apple.com',
			aud: 'wrong.client.id',
			exp: Math.floor(Date.now() / 1000) + 3600,
			sub: 'user123',
		});

		const mockToken = `${header}.${payload}.dummySignature`;

		await expect(handleIdentityToken(mockToken, mockClientId)).rejects.toThrow('identityToken is not a valid Apple JWT or has expired');
	});

	it('should successfully validate a valid token', async () => {
		const headerB64 = toBase64Url({ alg: 'RS256', kid: 'mock-key-id' });
		const payloadB64 = toBase64Url({
			iss: 'https://appleid.apple.com',
			aud: mockClientId,
			exp: Math.floor(Date.now() / 1000) + 3600,
			sub: 'user123',
		});

		const signatureBytes = sign('RSA-SHA256', Buffer.from(`${headerB64}.${payloadB64}`), privateKey);
		const signatureB64 = signatureBytes.toString('base64url');

		const validMockToken = `${headerB64}.${payloadB64}.${signatureB64}`;

		if (!jwkPublicKey.n || !jwkPublicKey.e) {
			throw new Error('Generated test key is missing modulus or exponent');
		}

		const mockJwksPayload = {
			keys: [
				{
					kty: 'RSA',
					kid: 'mock-key-id',
					use: 'sig',
					alg: 'RS256',
					n: jwkPublicKey.n,
					e: jwkPublicKey.e,
				},
			],
		};

		jest.mocked(serverFetch).mockResolvedValue(
			new Response(JSON.stringify(mockJwksPayload), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const result = await handleIdentityToken(validMockToken, mockClientId);

		expect(result.id).toBe('user123');
		expect(result.iss).toBe('https://appleid.apple.com');
	});

	it('should accept default mobile audience when client id setting is empty', async () => {
		const headerB64 = toBase64Url({ alg: 'RS256', kid: 'mock-key-id' });
		const payloadB64 = toBase64Url({
			iss: 'https://appleid.apple.com',
			aud: 'chat.rocket.ios',
			exp: Math.floor(Date.now() / 1000) + 3600,
			sub: 'user123',
		});

		const signatureBytes = sign('RSA-SHA256', Buffer.from(`${headerB64}.${payloadB64}`), privateKey);
		const signatureB64 = signatureBytes.toString('base64url');

		const validMockToken = `${headerB64}.${payloadB64}.${signatureB64}`;

		if (!jwkPublicKey.n || !jwkPublicKey.e) {
			throw new Error('Generated test key is missing modulus or exponent');
		}

		const mockJwksPayload = {
			keys: [
				{
					kty: 'RSA',
					kid: 'mock-key-id',
					use: 'sig',
					alg: 'RS256',
					n: jwkPublicKey.n,
					e: jwkPublicKey.e,
				},
			],
		};

		jest.mocked(serverFetch).mockResolvedValue(
			new Response(JSON.stringify(mockJwksPayload), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const result = await handleIdentityToken(validMockToken, '');

		expect(result.id).toBe('user123');
		expect(result.aud).toBe('chat.rocket.ios');
	});
});
