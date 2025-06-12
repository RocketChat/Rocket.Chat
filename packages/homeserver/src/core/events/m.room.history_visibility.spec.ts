import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { roomHistoryVisibilityEvent } from './m.room.history_visibility';

const finalEventId = '$a4hYydlvVc738DgFJA4hDHaIl_umBkHSV_efweAO5PE';
const finalEvent = {
	auth_events: [
		'$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE',
		'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
		'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
	],
	prev_events: ['$Uxo9MgF-4HQNEZdkkQDzgh9wlZ1yJbDXTMXCh6aZBi4'],
	type: 'm.room.history_visibility',
	room_id: '!uTqsSSWabZzthsSCNf:hs1',
	sender: '@admin:hs1',
	content: { history_visibility: 'shared' },
	depth: 5,
	state_key: '',
	origin: 'hs1',
	origin_server_ts: 1733107418720,
	hashes: { sha256: 'H1w6a6qPvdTtb2WKqacazfgiZvVHgK9/Np5DorJIy40' },
	signatures: {
		hs1: {
			'ed25519:a_HDhg':
				'ZHzOfPU2BYDilKSrt5zqMBC9ohZtHph4uLldOIzBY/oTO1pZCp3D9CRr04h5eJ7zkkuzkNv4y8+N0TDPNMHFBg',
		},
	},
	unsigned: { age_ts: 1733107418720 },
};

test('roomHistoryVisibilityEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const event = roomHistoryVisibilityEvent({
		roomId: '!uTqsSSWabZzthsSCNf:hs1',
		auth_events: [
			'$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE',
			'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
			'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
		],
		prev_events: ['$Uxo9MgF-4HQNEZdkkQDzgh9wlZ1yJbDXTMXCh6aZBi4'],
		depth: 5,
		sender: '@admin:hs1',
		ts: 1733107418720,
	});

	const signed = await signEvent(event, signature, 'hs1');
	event.content.history_visibility;
	signed.content.history_visibility;
	// @ts-ignore
	expect(signed).toStrictEqual(finalEvent);
	expect(signed).toHaveProperty(
		'signatures.hs1.ed25519:a_HDhg',
		'ZHzOfPU2BYDilKSrt5zqMBC9ohZtHph4uLldOIzBY/oTO1pZCp3D9CRr04h5eJ7zkkuzkNv4y8+N0TDPNMHFBg',
	);

	const eventId = generateId(signed);

	expect(eventId).toBe(finalEventId);
});
