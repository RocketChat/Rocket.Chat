import { isBareJid } from './isBareJid';

describe('isBareJid', () => {
	test.each([
		['alice@example.com'],
		['alice@localhost'],
		['a@b'],
		['alice@xmpp-1.example.com'],
		['nick#room@conference.example.com'],
		['josé@example.com'],
		['🚀@example.com'],
		[`${'a'.repeat(256)}@example.com`],
		[`alice@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}`],
	])('accepts %s', (value) => {
		expect(isBareJid(value)).toBe(true);
	});

	test.each([
		['example.com', 'no node'],
		['@example.com', 'empty node'],
		['alice@', 'empty domain'],
		['alice@example.com/phone', 'carries a resource'],
		['@alice:matrix.org', 'Matrix ID'],
		['alice:x@example.com', 'colon in node'],
		['john smith@example.com', 'space in node'],
		['a"b@example.com', 'quote in node'],
		['a&b@example.com', 'ampersand in node'],
		["a'b@example.com", 'apostrophe in node'],
		['a<b@example.com', 'angle bracket in node'],
		['a\u007Fb@example.com', 'DEL in node'],
		['a￾b@example.com', 'BOM in node'],
		['a\tb@example.com', 'control character in node'],
		['alice@bob@example.com', 'second @'],
		['alice@-example.com', 'label starts with a hyphen'],
		['alice@example-.com', 'label ends with a hyphen'],
		['alice@example..com', 'empty label'],
		['alice@example.com.', 'trailing dot'],
		['alice@exa_mple.com', 'underscore in domain'],
		['alice@exämple.com', 'non-ASCII domain'],
		[`${'é'.repeat(129)}@example.com`, 'node over 256 bytes'],
		[`alice@${'a.'.repeat(127)}ab`, 'domain over 255 bytes'],
	])('rejects %s (%s)', (value) => {
		expect(isBareJid(value)).toBe(false);
	});

	test.each([[undefined], [null], [42], [{}]])('rejects non-string %p', (value) => {
		expect(isBareJid(value)).toBe(false);
	});
});
