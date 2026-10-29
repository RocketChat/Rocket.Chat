import { createFakeConversation, createFakeMessage, createFakeMessageWithAttachment, createFakeRoom, createFakeSubscription } from '..';

describe('fixtures', () => {
	it('should give every message a distinct id', () => {
		const [first, second] = [createFakeMessage(), createFakeMessage()];

		expect(first._id).not.toBe(second._id);
	});

	it('should keep the overrides of nested fields', () => {
		const message = createFakeMessage({ u: { _id: 'someone', username: 'someone' } });

		expect(message.u).toMatchObject({ _id: 'someone', username: 'someone', name: 'Author' });
	});

	it('should attach the file it describes', () => {
		const message = createFakeMessageWithAttachment();

		expect(message.files?.[0]._id).toBe(message.file?._id);
		expect(message.attachments).toHaveLength(1);
	});

	it('should build a conversation sorted oldest first, ending at the given date', () => {
		const endsAt = new Date('2024-02-01T10:00:00.000Z');
		const messages = createFakeConversation({ count: 3, endsAt, minutesApart: 5 });

		expect(messages.map((message) => message.ts.toISOString())).toEqual([
			'2024-02-01T09:50:00.000Z',
			'2024-02-01T09:55:00.000Z',
			'2024-02-01T10:00:00.000Z',
		]);
	});

	it('should build rooms and subscriptions', () => {
		expect(createFakeRoom({ t: 'p' }).t).toBe('p');
		expect(createFakeSubscription({ rid: 'room' }).rid).toBe('room');
	});
});
