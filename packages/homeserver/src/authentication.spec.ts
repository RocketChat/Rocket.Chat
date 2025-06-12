import { describe, expect, test } from 'bun:test';

import {
	authorizationHeaders,
	computeAndMergeHash,
	computeHash,
	extractSignaturesFromHeader,
	generateId,
	signRequest,
	validateAuthorizationHeader,
} from './authentication';
import { generateKeyPairsFromString, type SigningKey } from './keys';
import { signJson, EncryptionValidAlgorithm } from './signJson';

// {
//     "content": {
//         "auth_events": [
//             "$aokhD3KlL_EHZ67626nn_aHMPW9K3T7rvT7IkrZaMbI",
//             "$-aRadmHs-xyc4xVWx38FmlIaM6xafoJsqCj3fVbkO-Q",
//             "$NAL56UfuEcLlL2kjmOYZvd5dQJY59Sxxp3l42iBNenw",
//             "$smcGuuNx478aANd8STTp0bDI94ER93vldR-_mO_KLyU"
//         ],
//         "content": {
//             "membership": "join"
//         },
//         "depth": 10,
//         "hashes": {
//             "sha256": "YBZHC60WOdOVDB2ISkVTnbg/L7J9qYBKWY+lUSZYIUk"
//         },
//         "origin": "synapse2",
//         "origin_server_ts": 1732999153019,
//         "prev_events": [
//             "$UqTWV2zA0fLTB2gj9iemXVyjamrt5X6GsSTnCQAtmik"
//         ],
//         "room_id": "!JVkUxGlBLsuOwTBUpN:synapse1",
//         "sender": "@rodrigo2:synapse2",
//         "signatures": {
//             "synapse2": {
//                 "ed25519:a_yNbw": "NKSz4x8fKwoNOOY/rcVVkVrzzt/TyFaL+8IJX9raSZNrMZFH5J3s2l+Z85q8McAUPp/pKKctI4Okk0Q7Q8OOBA"
//             }
//         },
//         "state_key": "@rodrigo2:synapse2",
//         "type": "m.room.member",
//         "unsigned": {
//             "age": 2
//         }
//     },
//     "destination": "synapse1",
//     "method": "PUT",
//     "origin": "synapse2",
//     "signatures": {
//         "synapse2": {
//             "ed25519:a_yNbw": "lxdmBBy9OtgsmRDbm1I3dhyslE4aFJgCcg48DBNDO0/rK4d7aUX3YjkDTMGLyugx9DT+s34AgxnBZOWRg1u6AQ"
//         }
//     },
//     "uri": "/_matrix/federation/v2/send_join/%21JVkUxGlBLsuOwTBUpN%3Asynapse1/%24UOFwq4Soj_komm7BQx5zhf-AmXiPw1nkTycvdlFT5tk?omit_members=true"
// }

test('signRequest', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
	);

	const event = Object.freeze({
		auth_events: [
			'$KMCKA2rA1vVCoN3ugpEnAja70o0jSksI-s2fqWy_1to',
			'$DcuwuadjnOUTC-IZmPdWHfCyxEgzuYcDvAoNpIJHous',
			'$tMNgmLPOG2gBqdDmNaT2iAjD54UQYaIzPpiGplxF5J4',
			'$8KCjO1lBtHMCUAYwe8y4-FMTwXnzXUb6F2g_Y6jHr4c',
		],
		prev_events: ['$KYvjqKYmahXxkpD7O_217w6P6g6DMrUixsFrJ_NI0nA'],
		type: 'm.room.member',
		room_id: '!EAuqyrnzwQoPNHvvmX:hs1',
		sender: '@admin:hs2',
		depth: 10,

		content: {
			// avatar_url: null,
			// displayname: "admin",
			membership: 'join',
		},

		hashes: {
			sha256: 'WUqhTZqxv+8GhGQv58qE/QFQ4Oua5BKqGFQGT35Dv10',
		},
		origin: 'hs2',
		origin_server_ts: 1733069433734,

		state_key: '@admin:hs2',
		signatures: {
			hs2: {
				'ed25519:a_XRhW':
					'DR+DBqFTm7IUa35pFeOczsNw4shglIXW+3Ze63wC3dqQ4okzaSRgLuAUkYnVyxM2sZkSvlbeSBS7G6DeeaDEAA',
			},
		},
		unsigned: {
			age: 1,
		},
	});

	const signed = await signJson(event, signature, 'hs2');

	expect(signed).toHaveProperty('signatures');
	expect(signed.signatures).toBeObject();
	expect(signed.signatures).toHaveProperty('hs2');
	expect(signed.signatures.hs2).toBeObject();
	expect(signed.signatures.hs2).toHaveProperty('ed25519:a_XRhW');
	expect(signed.signatures.hs2['ed25519:a_XRhW']).toBeString();

	expect(signed.signatures.hs2['ed25519:a_XRhW']).toBe(
		'DR+DBqFTm7IUa35pFeOczsNw4shglIXW+3Ze63wC3dqQ4okzaSRgLuAUkYnVyxM2sZkSvlbeSBS7G6DeeaDEAA',
	);

	const signedRequest = await signRequest(
		'hs2',
		signature,
		'hs1',
		'PUT',
		'/_matrix/federation/v2/send_join/%21EAuqyrnzwQoPNHvvmX%3Ahs1/%24P4qGIj3TWoJBnr1IGzXEvgRd1IljQYqlFZkMI8_GmwY?omit_members=true',
		{
			...signed,
			content: {
				...signed.content,
				avatar_url: null,
				displayname: 'admin',
			},
		},
	);

	expect(signedRequest).toBeObject();
	expect(signedRequest).toHaveProperty('signatures');
	expect(signedRequest.signatures).toBeObject();
	expect(signedRequest.signatures).toHaveProperty('hs2');
	expect(signedRequest.signatures.hs2).toBeObject();
	expect(signedRequest.signatures.hs2).toHaveProperty('ed25519:a_XRhW');
	expect(signedRequest.signatures.hs2['ed25519:a_XRhW']).toBeString();

	expect(signedRequest.signatures.hs2['ed25519:a_XRhW']).toBe(
		'KDhgfpGp+34ElXpvFIBjsGO2kldNZKj1CWFEbSjyQR142ZYx+kIg+N3muLlMXEK0Fw76T/2vjihEWhwffsbcAg',
	);

	const id = generateId(event);

	expect(id).toBe('$P4qGIj3TWoJBnr1IGzXEvgRd1IljQYqlFZkMI8_GmwY');
});

describe('generateId', () => {
	test('should generate a consistent ID for the same event content', () => {
		const event = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const id1 = generateId(event);
		const id2 = generateId(event);

		expect(id1).toBe(id2);
	});

	test('should generate different IDs for different event content', () => {
		const event1 = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const event2 = {
			type: 'm.room.message',
			sender: '@bob:example.com', // Different sender
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};

		const id1 = generateId(event1);
		const id2 = generateId(event2);

		expect(id1).not.toBe(id2);
	});

	test('should ignore fields like age_ts, unsigned, and signatures when generating ID', () => {
		const eventBase = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const id1 = generateId(eventBase);
		const id2 = generateId({
			...eventBase,
			age_ts: 100,
			unsigned: { age: 100 },
			signatures: { 'example.com': { 'ed25519:keyid': 'signature' } },
		});

		expect(id1).toBe(id2);
	});

	test('should produce a URL-safe base64 string starting with $', () => {
		const event = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Test event for ID format',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const id = generateId(event);
		expect(id).toMatch(/^\$[A-Za-z0-9_\/-]+$/);
	});
});

test('computeAndMergeHash', async () => {
	const result = computeAndMergeHash({
		auth_events: [
			'$e0YmwnKseuHqsuF50ekjta7z5UpO-bDoq7y4R1NKMpI',
			'$6_VX-xW821oaBwOuaaV_xoC6fD2iMg2QPWD4J7Bh3o4',
			'$9m9s2DShzjg5WBpAsj2lfOSFVCHBJ1DIpayouOij5Nk',
			'$fmahdKvkzQlGFCj9WM_eDtbI3IG08J6DNyqEFpgAT7Q',
		],
		content: { membership: 'join' },
		depth: 9,
		origin: 'synapse1',
		origin_server_ts: 1733002629635,
		prev_events: ['$lD8jXrQmHr7KhxekqNPHFC-gzjYq3Gf_Oyr896K69JY'],
		room_id: '!bhjQdfkUhiyKSsJbFt:synapse1',
		sender: '@asd11:homeserver',
		state_key: '@asd11:homeserver',
		type: 'm.room.member',
		unsigned: { age: 2 },
		signatures: {},
	});

	expect(result.hashes.sha256).toBe(
		'nPC9Qk7Amj+ykakbc25gzyyCdHrukUflCNeAM5DGoU4',
	);
});

describe('computeHash', () => {
	test('should compute a sha256 hash for an event', () => {
		const event = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const [algorithm, hash] = computeHash(event);

		expect(algorithm).toBe('sha256');
		expect(typeof hash).toBe('string');
		expect(hash.length).toBeGreaterThan(0);
	});

	test('should ignore excluded fields when computing hash', () => {
		const eventBase = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const [, hash1] = computeHash(eventBase);
		const [, hash2] = computeHash({
			...eventBase,
			age_ts: 100,
			unsigned: { age: 100 },
			signatures: { 'example.com': { 'ed25519:keyid': 'signature' } },
			hashes: { sha256: 'oldhash' },
			outlier: true,
			destinations: ['server1'],
		});

		expect(hash1).toBe(hash2);
	});

	test('should produce a consistent hash for the same content', () => {
		const event = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const [, hash1] = computeHash(event);
		const [, hash2] = computeHash(event);

		expect(hash1).toBe(hash2);
	});

	test('should produce different hashes for different content', () => {
		const event1 = {
			type: 'm.room.message',
			sender: '@alice:example.com',
			room_id: '!someroom:example.com',
			content: {
				body: 'Hello world!',
				msgtype: 'm.text',
			},
			origin_server_ts: 1234567890,
		};
		const event2 = {
			...event1,
			content: { ...event1.content, body: 'Hello other world!' },
		};
		const [, hash1] = computeHash(event1);
		const [, hash2] = computeHash(event2);

		expect(hash1).not.toBe(hash2);
	});
});

describe('validateAuthorizationHeader', () => {
	const origin = 'origin.com';
	const signingKey = 'Y0q3MVIjcsL40MCiR4R0YfH0f7k8Q0J6a3g0YfH0f7k=';
	const destination = 'destination.com';
	const method = 'GET';
	const uri = '/_matrix/federation/v1/version';

	const realSignature =
		'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='; // 64 bytes of zeros

	test('should return true for a valid signature', async () => {
		await expect(
			validateAuthorizationHeader(
				origin,
				signingKey,
				destination,
				method,
				uri,
				realSignature,
			),
		).rejects.toThrow(`Invalid signature for ${destination}`);
	});

	test('should throw an error for an invalid (malformed) signature', async () => {
		const invalidSignature = 'this_is_not_base64_and_is_short';

		await expect(
			validateAuthorizationHeader(
				origin,
				signingKey,
				destination,
				method,
				uri,
				invalidSignature,
			),
		).rejects.toThrow();
	});

	test('should attempt validation for a signature with content', async () => {
		const content = { foo: 'bar' };
		const realSignatureWithContent =
			'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB==';

		await expect(
			validateAuthorizationHeader(
				origin,
				signingKey,
				destination,
				method,
				uri,
				realSignatureWithContent,
				content,
			),
		).rejects.toThrow(`Invalid signature for ${destination}`);
	});

	test('should throw an error if the key is not valid base64', async () => {
		await expect(
			validateAuthorizationHeader(
				origin,
				'not-a-base64-key!',
				destination,
				method,
				uri,
				realSignature,
			),
		).rejects.toThrow();
	});
});

describe('authorizationHeaders', () => {
	const origin = 'origin.com';
	const destination = 'destination.com';
	const method = 'GET';
	const uri = '/_matrix/federation/v1/version';
	const signingKey: SigningKey = {
		publicKey: Buffer.from(
			'Y0q3MVIjcsL40MCiR4R0YfH0f7k8Q0J6a3g0YfH0f7k=',
			'base64',
		),
		privateKey: Buffer.from(
			'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
			'base64',
		),
		algorithm: EncryptionValidAlgorithm.ed25519,
		version: 'testkey',
		sign: async (data: Uint8Array) => Buffer.from(data),
	};

	test('should generate correct authorization header string without content', async () => {
		const header = await authorizationHeaders(
			origin,
			signingKey,
			destination,
			method,
			uri,
		);

		expect(header).toMatch(
			/^X-Matrix origin="origin.com",destination="destination.com",key="ed25519:testkey",sig=".+"$/,
		);
	});

	test('should generate correct authorization header string with content', async () => {
		const content = { foo: 'bar' };
		const header = await authorizationHeaders(
			origin,
			signingKey,
			destination,
			method,
			uri,
			content,
		);

		expect(header).toMatch(
			/^X-Matrix origin="origin.com",destination="destination.com",key="ed25519:testkey",sig=".+"$/,
		);
	});

	test('should produce different signatures for different content', async () => {
		const header1 = await authorizationHeaders(
			origin,
			signingKey,
			destination,
			method,
			uri,
			{ data: 'content1' },
		);
		const header2 = await authorizationHeaders(
			origin,
			signingKey,
			destination,
			method,
			uri,
			{ data: 'content2' },
		);

		const sig1 = header1.match(/sig="([^\"]+)"/)?.[1];
		const sig2 = header2.match(/sig="([^\"]+)"/)?.[1];

		expect(sig1).toBeDefined();
		expect(sig2).toBeDefined();
		expect(sig1).not.toBe(sig2);
	});
});

describe('extractSignaturesFromHeader', async () => {
	test('it should extract the origin, destination, key, and signature from the authorization header', async () => {
		expect(
			extractSignaturesFromHeader(
				'X-Matrix origin="synapse1",destination="synapse2",key="ed25519:a_yNbw",sig="lxdmBBy9OtgsmRDbm1I3dhyslE4aFJgCcg48DBNDO0/rK4d7aUX3YjkDTMGLyugx9DT+s34AgxnBZOWRg1u6AQ"',
			),
		).toStrictEqual({
			destination: 'synapse2',
			key: 'ed25519:a_yNbw',
			origin: 'synapse1',
			signature:
				'lxdmBBy9OtgsmRDbm1I3dhyslE4aFJgCcg48DBNDO0/rK4d7aUX3YjkDTMGLyugx9DT+s34AgxnBZOWRg1u6AQ',
		});
	});

	test('it should throw an error if the authorization header is invalid', async () => {
		expect(() =>
			extractSignaturesFromHeader(
				'X-Matrix origin="synapse1",destination="synapse2",key="ed25519:a_yNbw",sig="lxdmBBy9OtgsmRDbm1I3dhyslE4aFJgCcg48DBNDO0/rK4d7aUX3YjkDTMGLyugx9DT+s34AgxnBZOWRg1u6AQ',
			),
		).toThrow('Invalid authorization header');
	});
});
