import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { roomGuestAccessEvent } from './m.room.guest_access';

const finalEventId = '$gdAY3-3DdjuG-uyFkDn8q5wPS4fbymH__fch9BQmOas';
const finalEvent = {
	auth_events: [
		'$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE',
		'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
		'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
	],
	prev_events: ['$a4hYydlvVc738DgFJA4hDHaIl_umBkHSV_efweAO5PE'],
	type: 'm.room.guest_access',
	room_id: '!uTqsSSWabZzthsSCNf:hs1',
	sender: '@admin:hs1',
	content: { guest_access: 'can_join' },
	depth: 6,
	state_key: '',
	origin: 'hs1',
	origin_server_ts: 1733107418721,
	hashes: { sha256: 'ArUZZ33x+j5oMNWhWvHDXBH7qrMRMbsqig5XDM5jOac' },
	signatures: {
		hs1: {
			'ed25519:a_HDhg':
				'PLaE7un6a+pzrsU/0kiB/tvneZp5/dEda4+uE7UK411hNaM4W4ZUo52ua6AGO9q5gLBjSmnR90/tPf714HiTBw',
		},
	},
	unsigned: { age_ts: 1733107418721 },
} as const;

test('roomGuestAccessEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const event = roomGuestAccessEvent({
		roomId: '!uTqsSSWabZzthsSCNf:hs1',
		auth_events: [
			'$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE',
			'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
			'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
		],
		prev_events: ['$a4hYydlvVc738DgFJA4hDHaIl_umBkHSV_efweAO5PE'],
		depth: 6,
		sender: '@admin:hs1',
		ts: 1733107418721,
	});

	const signed = await signEvent(event, signature, 'hs1');
	// @ts-ignore
	expect(signed).toStrictEqual(finalEvent);
	expect(signed).toHaveProperty(
		'signatures.hs1.ed25519:a_HDhg',
		'PLaE7un6a+pzrsU/0kiB/tvneZp5/dEda4+uE7UK411hNaM4W4ZUo52ua6AGO9q5gLBjSmnR90/tPf714HiTBw',
	);

	const eventId = generateId(signed);

	expect(eventId).toBe(finalEventId);
});
