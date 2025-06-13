import { expect, test, describe } from 'bun:test';
import { createRoomCreateEvent, roomCreateEvent } from '../m.room.create';
import { signEvent } from '../../../signEvent';
import { generateId } from '../../../authentication';
import { createSignedEvent } from './createSignedEvent';
import { generateKeyPairsFromString } from '../../../keys';

describe('makeSignedEvent', () => {
	test('it should return the same payload, following create event > sign > generate id', async () => {
		const signature = await generateKeyPairsFromString(
			'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
		);

		const event = roomCreateEvent({
			roomId: '!uTqsSSWabZzthsSCNf:hs1',
			sender: '@admin:hs1',
			ts: 1733069433734,
		});
		const signed = await signEvent(event, signature, 'hs1');
		const id = generateId(signed);

		const makeSignedEvent = createSignedEvent(signature, 'hs1');
		const result = await createRoomCreateEvent(makeSignedEvent)({
			roomId: '!uTqsSSWabZzthsSCNf:hs1',
			sender: '@admin:hs1',
			ts: 1733069433734,
		});

		expect({
			event: signed,
			_id: id,
			// @ts-ignore
		}).toStrictEqual(result);
	});
});
