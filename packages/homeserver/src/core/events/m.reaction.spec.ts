import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { reactionEvent } from './m.reaction';

const finalEvent = {
	auth_events: [
		'$lBxmA2J-6fGfOjUZ6dPCanOdBdkawli08Jf1IuH8aso',
		'$mxzNPfcqEDUUuWm7xs44NguWJ3A2nWu6UxXt4TlX-T8',
		'$TK2UQZ-AEsSoIIRoTKYBTf9c1wW8X3AmjLhnuiSnDmY',
	],
	prev_events: ['$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA'],
	type: 'm.reaction',
	room_id: '!MZyyuzkUwHEaBBOXai:hs1',
	sender: '@user:rc1',
	depth: 4,
	origin: 'rc1',
	origin_server_ts: 1747837631863,
	content: {
		'm.relates_to': {
			rel_type: 'm.annotation',
			event_id: '$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA',
			key: ':+1:',
		},
	},
};

test('reactionEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const { state_key: reactionStateKey, ...reaction } = reactionEvent({
		roomId: '!MZyyuzkUwHEaBBOXai:hs1',
		sender: '@user:rc1',
		auth_events: {
			'm.room.create': '$lBxmA2J-6fGfOjUZ6dPCanOdBdkawli08Jf1IuH8aso',
			'm.room.power_levels': '$mxzNPfcqEDUUuWm7xs44NguWJ3A2nWu6UxXt4TlX-T8',
			'm.room.member': '$TK2UQZ-AEsSoIIRoTKYBTf9c1wW8X3AmjLhnuiSnDmY',
		},
		prev_events: ['$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA'],
		depth: 4,
		content: {
			'm.relates_to': {
				rel_type: 'm.annotation',
				event_id: '$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA',
				key: ':+1:',
			},
		},
		origin: 'rc1',
		ts: 1747837631863,
	});

	const signedReaction = await signEvent(reaction, signature, 'rc1');
	const reactionEventId = generateId(signedReaction);

	expect(signedReaction).toMatchObject(finalEvent);
	expect(reactionEventId).toBe(reactionEventId);
});
