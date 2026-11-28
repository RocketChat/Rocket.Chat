import { deriveInboundEventId, deriveInboundMessageId } from './messageId';

const key = { rid: 'room1', authorKey: 'alice@remote.tld', senderId: 'm1' };

describe('deriveInboundMessageId', () => {
	it('derives the same id for the original and for a stanza that references it', () => {
		expect(deriveInboundMessageId('secret', key)).toBe(deriveInboundMessageId('secret', { ...key }));
	});

	it('looks like a Random.id()', () => {
		expect(deriveInboundMessageId('secret', key)).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/);
	});

	it.each([
		['room', { ...key, rid: 'room2' }],
		['author', { ...key, authorKey: 'bob@remote.tld' }],
		['sender id', { ...key, senderId: 'm2' }],
	])('differs when the %s differs', (_, other) => {
		expect(deriveInboundMessageId('secret', other)).not.toBe(deriveInboundMessageId('secret', key));
	});

	it('cannot be predicted without the secret', () => {
		expect(deriveInboundMessageId('other secret', key)).not.toBe(deriveInboundMessageId('secret', key));
	});

	it('keeps the fields apart, so no two keys share an id by concatenation', () => {
		expect(deriveInboundMessageId('secret', { rid: 'a', authorKey: 'bc', senderId: 'd' })).not.toBe(
			deriveInboundMessageId('secret', { rid: 'ab', authorKey: 'c', senderId: 'd' }),
		);
	});
});

describe('deriveInboundEventId', () => {
	const sent = { originDomain: 'remote.tld', rid: 'room1', authorKey: 'alice@remote.tld', senderId: 'm1' };

	it('is the same for every copy of one message (message-deduplication R1)', () => {
		expect(deriveInboundEventId(sent)).toBe(deriveInboundEventId({ ...sent }));
	});

	it('tells apart two senders who number their messages alike (message-deduplication R2)', () => {
		expect(deriveInboundEventId({ ...sent, authorKey: 'bob@remote.tld' })).not.toBe(deriveInboundEventId(sent));
	});

	it('tells apart one sender reusing an id in another room (message-deduplication R2)', () => {
		expect(deriveInboundEventId({ ...sent, rid: 'room2' })).not.toBe(deriveInboundEventId(sent));
	});

	it('keeps the author and the id apart, so no two keys share an event id by concatenation', () => {
		expect(deriveInboundEventId({ ...sent, authorKey: 'a:b', senderId: 'c' })).not.toBe(
			deriveInboundEventId({ ...sent, authorKey: 'a', senderId: 'b:c' }),
		);
	});

	it("uses the room's own id, scoped to the room, whoever the author is (message-deduplication R2)", () => {
		const stamped = { ...sent, roomStanzaId: 'room-id' };
		expect(deriveInboundEventId(stamped)).toBe('xmpp:remote.tld:room1:room-id');
		expect(deriveInboundEventId({ ...stamped, authorKey: 'bob@remote.tld', senderId: 'other' })).toBe(deriveInboundEventId(stamped));
		expect(deriveInboundEventId({ ...stamped, rid: 'room2' })).not.toBe(deriveInboundEventId(stamped));
	});

	it('is nothing without any id', () => {
		expect(deriveInboundEventId({ ...sent, senderId: undefined })).toBeUndefined();
	});
});
