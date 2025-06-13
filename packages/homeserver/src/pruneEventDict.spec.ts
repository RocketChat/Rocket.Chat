import { describe, expect, test } from 'bun:test';

import { pruneEventDict } from './pruneEventDict';

const event = {
	method: 'PUT',
	uri: '/_matrix/federation/v2/send_join/%21stZYXyAjGqdrRXQCUd%3Asynapse1/%24NEOm7EXN_sGEsAX8DtgLCNQN_yIhpqI4QSAasUdN2_M?omit_members=true',
	destination: 'synapse1',
	signatures: {
		synapse2: {
			'ed25519:a_yNbw':
				'4rVyjfM9Apz6O93HvqkeidmsjwNGHD9WbEA1AdUsjdbACPM67iJK75BQLBLcw5NQj3q/eL7+kGaknkqJH8kEAw',
		},
	},
	content: {
		auth_events: [
			'$H0LeIqLFrRLluiFj3S4WGYDOWF4MWOFupwwJWoQSIcM',
			'$zykSnvjcDbN_t0G3vIqjlXYnzMPhRHzbG9-xZy0yKMo',
			'$brN97rWTFjQbIQHy2FNwg4BHc5HbhruxQHdCdk__Lb0',
			'$7tKDuHnd8QKPx_T_9-2WGAgJLqjfOndQgzWM1afTQLQ',
		],
		content: { avatar_url: null, displayname: 'rodrigo2', membership: 'join' },
		depth: 10,
		hashes: { sha256: 'cODp/PTAbpzi/99k8pjndC+nwqtWP517zMFO3h97/tU' },
		origin: 'synapse2',
		origin_server_ts: 1732997736638,
		prev_events: ['$sJEh3Y3372d1TWNaW9Vsbkh-IUlOMh2a5z6BN9-spTQ'],
		room_id: '!stZYXyAjGqdrRXQCUd:synapse1',
		sender: '@rodrigo2:synapse2',
		signatures: {
			synapse2: {
				'ed25519:a_yNbw':
					'0mp0rfrdjPhJFK603sAjCp/iau2cGnxTXhwJoyyrnLw7uqhVs/1vzNxjnntU2G5GFtKLa6YqNzSooLsqhptgBQ',
			},
		},
		state_key: '@rodrigo2:synapse2',
		type: 'm.room.member',
		// @ts-ignore
		unsigned: { age: 1 },
	},
	origin: 'synapse2',
};

describe('pruneEventDict', () => {
	test('m.room.member', () => {
		const result = pruneEventDict(event.content);

		expect(result).toEqual({
			auth_events: [
				'$H0LeIqLFrRLluiFj3S4WGYDOWF4MWOFupwwJWoQSIcM',
				'$zykSnvjcDbN_t0G3vIqjlXYnzMPhRHzbG9-xZy0yKMo',
				'$brN97rWTFjQbIQHy2FNwg4BHc5HbhruxQHdCdk__Lb0',
				'$7tKDuHnd8QKPx_T_9-2WGAgJLqjfOndQgzWM1afTQLQ',
			],
			// @ts-ignore
			content: {
				// avatar_url: null, --> it should be removed
				// displayname: "rodrigo2", --> it should be removed
				membership: 'join',
			},
			depth: 10,
			hashes: { sha256: 'cODp/PTAbpzi/99k8pjndC+nwqtWP517zMFO3h97/tU' },
			origin: 'synapse2',
			origin_server_ts: 1732997736638,
			prev_events: ['$sJEh3Y3372d1TWNaW9Vsbkh-IUlOMh2a5z6BN9-spTQ'],
			room_id: '!stZYXyAjGqdrRXQCUd:synapse1',
			sender: '@rodrigo2:synapse2',
			signatures: {
				synapse2: {
					'ed25519:a_yNbw':
						'0mp0rfrdjPhJFK603sAjCp/iau2cGnxTXhwJoyyrnLw7uqhVs/1vzNxjnntU2G5GFtKLa6YqNzSooLsqhptgBQ',
				},
			},
			state_key: '@rodrigo2:synapse2',
			type: 'm.room.member',
			// @ts-ignore
			unsigned: {
				// age: 1 --> it should be removed
			},
		});
	});
});
