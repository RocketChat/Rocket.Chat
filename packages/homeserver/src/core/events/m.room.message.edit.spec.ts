import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { roomMessageEvent } from './m.room.message';

const finalEventId = '$ZOaP3B_i9LQttJyLIQMOvGtoJqrzBbqDJA1hpt25PUI';
const finalEvent = {
	auth_events: [
		'$zHsjo62uA3WT_8ZGvr53LIUxPOTbJ-MKPu2JsA6eGdw',
		'$mockedPowerLevelsEventId',
		'$iyTj_L9HN1LNr2wjiHLz6Q7-HVjrKnCWyvwEM2yl6gE',
	],
	prev_events: ['$Ba7sNv7Qg9-u-1mj7aOAtncgN8oGpmhfK8mHc_bBFHY'],
	type: 'm.room.message',
	room_id: '!MZyyuzkUwHEaBBOXai:hs1',
	sender: '@user:rc1',
	depth: 4,
	origin: 'rc1',
	origin_server_ts: 1747792598236,
	content: {
		body: '* Hello, **bold** and _italic_ text!',
		msgtype: 'm.text',
		'm.mentions': {},
		'm.relates_to': {
			rel_type: 'm.replace',
			event_id: '$Ba7sNv7Qg9-u-1mj7aOAtncgN8oGpmhfK8mHc_bBFHY',
		},
		'm.new_content': {
			msgtype: 'm.text',
			body: 'edited hey message!',
		},
	},
	hashes: {
		sha256: 'itSvHqpbW2IOULSY1k7rhtCAfDGbQXV+VVeRll4mHis',
	},
	unsigned: {
		age_ts: 1747792598236,
	},
	signatures: {
		rc1: {
			'ed25519:a_HDhg':
				'SCxkiAspRbWE7COF9IncV1eGiJPSb4iwLQi90rijpCXj8iALXTS6M4uVljpEzRgyz6Xa9UZ6ea+kguDFrbxKDA',
		},
	},
};

test('formatted content editing', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	// Mock environment
	const createEventId = '$zHsjo62uA3WT_8ZGvr53LIUxPOTbJ-MKPu2JsA6eGdw';
	const powerLevelsEventId = '$mockedPowerLevelsEventId';
	const memberEventId = '$iyTj_L9HN1LNr2wjiHLz6Q7-HVjrKnCWyvwEM2yl6gE';

	// Create an original message with HTML formatting
	const originalMessage = roomMessageEvent({
		roomId: '!MZyyuzkUwHEaBBOXai:hs1',
		sender: '@user:rc1',
		content: {
			body: 'Hello, **bold** text!',
			msgtype: 'm.text',
			'm.mentions': {},
			format: 'org.matrix.custom.html',
			formatted_body: 'Hello, <strong>bold</strong> text!',
		},
		ts: 1747792498236,
		depth: 3,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			'm.room.member': memberEventId,
		},
		prev_events: [memberEventId],
	});
	const signedOriginalMessage = await signEvent(
		originalMessage,
		signature,
		'rc1',
	);
	const originalMessageId = generateId(signedOriginalMessage);

	// Create an edit with HTML formatting
	const { state_key, ...editEvent } = roomMessageEvent({
		roomId: '!MZyyuzkUwHEaBBOXai:hs1',
		sender: '@user:rc1',
		content: {
			body: '* Hello, **bold** and _italic_ text!',
			msgtype: 'm.text',
			'm.mentions': {},
			'm.relates_to': {
				rel_type: 'm.replace',
				event_id: originalMessageId,
			},
			'm.new_content': {
				body: 'edited hey message!',
				msgtype: 'm.text',
			},
		},
		ts: 1747792598236,
		depth: 4,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			'm.room.member': memberEventId,
		},
		prev_events: [originalMessageId],
	});

	const signedEdit = await signEvent(editEvent, signature, 'rc1');
	const eventId = generateId(signedEdit);

	expect(signedEdit).toMatchObject(finalEvent);
	expect(eventId).toBe(finalEventId);
});
