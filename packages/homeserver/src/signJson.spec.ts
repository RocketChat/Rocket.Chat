import { describe, expect, it, test } from 'bun:test';
import { generateKeyPairsFromString } from './keys';
import { pruneEventDict } from './pruneEventDict';
import {
	EncryptionValidAlgorithm,
	signJson,
	verifySignaturesFromRemote,
} from './signJson';

describe('verifySignaturesFromRemote', async () => {
	test('it should verify a valid signature', async () => {
		const serverName = 'synapse';
		const signature = await generateKeyPairsFromString(
			'ed25519 a_yNbw tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8',
		);

		const signed = await signJson({}, signature, serverName);

		await verifySignaturesFromRemote(
			signed,
			serverName,
			async () => signature.publicKey,
		);

		expect(
			async () =>
				await verifySignaturesFromRemote(
					signed,
					serverName,
					async () => signature.publicKey,
				),
		).not.toThrow();
	});

	test('it should throw an error if the signature is invalid', async () => {
		const serverName = 'synapse';
		const signature = await generateKeyPairsFromString(
			'ed25519 a_yNbw tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8',
		);

		const signed = await signJson({}, signature, serverName);

		expect(
			async () =>
				await verifySignaturesFromRemote(signed, serverName, async () =>
					Uint8Array.from(
						atob('tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8'),
						(c) => c.charCodeAt(0),
					),
				),
		).toThrow();
	});

	test('it should throw an error if there is no valid protocol version', async () => {
		const serverName = 'synapse';

		expect(
			async () =>
				await verifySignaturesFromRemote(
					{
						signatures: {
							[serverName]: {
								[`${EncryptionValidAlgorithm.ed25519}1:a_yNbw`]: 'invalid',
							},
						},
					},
					serverName,
					async () =>
						Uint8Array.from(
							atob('tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8'),
							(c) => c.charCodeAt(0),
						),
				),
		).toThrow(
			`Invalid algorithm ${EncryptionValidAlgorithm.ed25519}1 for ${serverName}`,
		);
	});

	it('it should throw an error if the signature is invalid for the serverName', async () => {
		const serverName = 'synapse';

		expect(
			async () =>
				await verifySignaturesFromRemote(
					{
						signatures: {
							differentServer: {
								[`${EncryptionValidAlgorithm.ed25519}1:a_yNbw`]: 'invalid',
							},
						},
					},
					serverName,
					async () =>
						Uint8Array.from(
							atob('tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8'),
							(c) => c.charCodeAt(0),
						),
				),
		).toThrow(`Signatures not found for ${serverName}`);
	});
});

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

test('signJson send_join', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_yNbw tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8',
	);

	const signed = await signJson(
		pruneEventDict({
			auth_events: [
				'$aokhD3KlL_EHZ67626nn_aHMPW9K3T7rvT7IkrZaMbI',
				'$-aRadmHs-xyc4xVWx38FmlIaM6xafoJsqCj3fVbkO-Q',
				'$NAL56UfuEcLlL2kjmOYZvd5dQJY59Sxxp3l42iBNenw',
				'$smcGuuNx478aANd8STTp0bDI94ER93vldR-_mO_KLyU',
			],
			prev_events: ['$UqTWV2zA0fLTB2gj9iemXVyjamrt5X6GsSTnCQAtmik'],
			type: 'm.room.member',
			room_id: '!JVkUxGlBLsuOwTBUpN:synapse1',
			sender: '@rodrigo2:synapse2',
			depth: 10,

			content: {
				membership: 'join',
				avatar_url: null,
				displayname: 'rodrigo2',
			},

			hashes: {
				sha256: 'YBZHC60WOdOVDB2ISkVTnbg/L7J9qYBKWY+lUSZYIUk',
			},
			origin: 'synapse2',
			origin_server_ts: 1732999153019,

			state_key: '@rodrigo2:synapse2',
			unsigned: {
				age: 2,
			},
		}),
		signature,
		'synapse2',
	);

	expect(signed).toHaveProperty('signatures');
	expect(signed.signatures).toBeObject();
	expect(signed.signatures).toHaveProperty('synapse2');
	expect(signed.signatures.synapse2).toBeObject();
	expect(signed.signatures.synapse2).toHaveProperty('ed25519:a_yNbw');
	expect(signed.signatures.synapse2['ed25519:a_yNbw']).toBeString();

	expect(signed.signatures.synapse2['ed25519:a_yNbw']).toBe(
		'NKSz4x8fKwoNOOY/rcVVkVrzzt/TyFaL+8IJX9raSZNrMZFH5J3s2l+Z85q8McAUPp/pKKctI4Okk0Q7Q8OOBA',
	);
});

// {
//     "destination": "synapse1",
//     "method": "GET",
//     "origin": "synapse2",
//     "signatures": {
//         "synapse2": {
//             "ed25519:a_yNbw": "YmiPpEE6QAeZzd8qw/FUXw2kiu0FJsApxnDfnbZmcEY5gFP97srHRqRzLjBn8Rh38nV2ZFTPXOV2Req+7JR1Bw"
//         }
//     },
//     "uri": "/_matrix/federation/v1/make_join/%21JVkUxGlBLsuOwTBUpN%3Asynapse1/%40rodrigo2%3Asynapse2?ver=1&ver=2&ver=3&ver=4&ver=5&ver=6&ver=7&ver=8&ver=9&ver=10&ver=11&ver=org.matrix.msc3757.10&ver=org.matrix.msc3757.11"
// }

test('signJson make_join', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_yNbw tBD7FfjyBHgT4TwhwzvyS9Dq2Z9ck38RRQKaZ6Sz2z8',
	);

	const signed = await signJson(
		{
			destination: 'synapse1',
			method: 'GET',
			origin: 'synapse2',
			signatures: {
				synapse2: {
					'ed25519:a_yNbw':
						'YmiPpEE6QAeZzd8qw/FUXw2kiu0FJsApxnDfnbZmcEY5gFP97srHRqRzLjBn8Rh38nV2ZFTPXOV2Req+7JR1Bw',
				},
			},
			uri: '/_matrix/federation/v1/make_join/%21JVkUxGlBLsuOwTBUpN%3Asynapse1/%40rodrigo2%3Asynapse2?ver=1&ver=2&ver=3&ver=4&ver=5&ver=6&ver=7&ver=8&ver=9&ver=10&ver=11&ver=org.matrix.msc3757.10&ver=org.matrix.msc3757.11',
		},
		signature,
		'synapse2',
	);

	expect(signed).toHaveProperty('signatures');
	expect(signed.signatures).toBeObject();
	expect(signed.signatures).toHaveProperty('synapse2');
	expect(signed.signatures.synapse2).toBeObject();
	expect(signed.signatures.synapse2).toHaveProperty('ed25519:a_yNbw');
	expect(signed.signatures.synapse2['ed25519:a_yNbw']).toBeString();

	expect(signed.signatures.synapse2['ed25519:a_yNbw']).toBe(
		'YmiPpEE6QAeZzd8qw/FUXw2kiu0FJsApxnDfnbZmcEY5gFP97srHRqRzLjBn8Rh38nV2ZFTPXOV2Req+7JR1Bw',
	);
});
