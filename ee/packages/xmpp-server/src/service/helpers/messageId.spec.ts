import { deriveInboundMessageId } from './messageId';

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
