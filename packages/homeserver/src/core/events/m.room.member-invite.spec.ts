import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { roomMemberEvent } from './m.room.member';

const finalEventId = '$nzfaHPXjmyOQerkm4WOlFupYVq56ZDHqC42DlgPydaI';
const finalEvent = {
	auth_events: [
		'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
		'$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE',
		'$Uxo9MgF-4HQNEZdkkQDzgh9wlZ1yJbDXTMXCh6aZBi4',
		'$HistVisAuthEvent123456789012345678901234567890',
	],
	prev_events: ['$gdAY3-3DdjuG-uyFkDn8q5wPS4fbymH__fch9BQmOas'],
	type: 'm.room.member',
	room_id: '!uTqsSSWabZzthsSCNf:hs1',
	sender: '@admin:hs1',
	content: {
		is_direct: true,
		displayname: '@asd6:rc1',
		avatar_url: 'mxc://matrix.org/MyC00lAvatar',
		membership: 'invite',
	},
	depth: 7,
	state_key: '@asd6:rc1',
	origin: 'hs1',
	origin_server_ts: 1733107418773,
	hashes: { sha256: '1tVvOpcM7iQz9kacDoUa8vhNMQVZZhA+5txzwsH8NR8' },
	signatures: {
		hs1: {
			'ed25519:a_HDhg':
				'8/qPp2d0PTc4bVMNdbTl32OSFnNqXan9ACQr1QcDV3SgdsDnm+sZv2mXW8rdhIOLOohRG2cED0+1aNxV7VH2Cw',
		},
	},
	unsigned: {
		age: 4,
		age_ts: 1733107418773,
		invite_room_state: [
			{
				type: 'm.room.join_rules',
				state_key: '',
				content: { join_rule: 'invite' },
				sender: '@admin:hs1',
			},
			{
				type: 'm.room.create',
				state_key: '',
				content: { room_version: '10', creator: '@admin:hs1' },
				sender: '@admin:hs1',
			},
			{
				type: 'm.room.member',
				state_key: '@admin:hs1',
				content: { displayname: 'admin', membership: 'join' },
				sender: '@admin:hs1',
			},
		],
	},
};

test('roomMemberInviteEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const memberEvent = roomMemberEvent({
		membership: 'invite',
		roomId: '!uTqsSSWabZzthsSCNf:hs1',
		sender: '@admin:hs1',
		state_key: '@asd6:rc1',
		ts: 1733107418773,
		depth: 7,
		auth_events: {
			'm.room.create': '$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
			'm.room.power_levels': '$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE',
			'm.room.join_rules': '$Uxo9MgF-4HQNEZdkkQDzgh9wlZ1yJbDXTMXCh6aZBi4',
			'm.room.member:@admin:hs1':
				'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
			'm.room.history_visibility':
				'$HistVisAuthEvent123456789012345678901234567890',
		},
		prev_events: ['$gdAY3-3DdjuG-uyFkDn8q5wPS4fbymH__fch9BQmOas'],
		content: {
			is_direct: true,
			displayname: '@asd6:rc1',
			avatar_url: 'mxc://matrix.org/MyC00lAvatar',
			membership: 'invite',
		},
		unsigned: {
			// TODO: Check what this is
			age: 4,
			age_ts: 1733107418773,
			invite_room_state: [
				{
					type: 'm.room.join_rules',
					state_key: '',
					content: { join_rule: 'invite' },
					sender: '@admin:hs1',
				},
				{
					type: 'm.room.create',
					state_key: '',
					content: { room_version: '10', creator: '@admin:hs1' },
					sender: '@admin:hs1',
				},
				{
					type: 'm.room.member',
					state_key: '@admin:hs1',
					content: { displayname: 'admin', membership: 'join' },
					sender: '@admin:hs1',
				},
			],
		},
	} as const);
	const signed = await signEvent(memberEvent, signature, 'hs1');

	// @ts-ignore
	expect(signed).toStrictEqual(finalEvent);
	expect(signed).toHaveProperty(
		'signatures.hs1.ed25519:a_HDhg',
		'8/qPp2d0PTc4bVMNdbTl32OSFnNqXan9ACQr1QcDV3SgdsDnm+sZv2mXW8rdhIOLOohRG2cED0+1aNxV7VH2Cw',
	);

	const memberEventId = generateId(signed);

	expect(memberEventId).toBe(finalEventId);
});
