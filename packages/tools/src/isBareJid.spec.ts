import { isBareJid, normalizeBareJid } from './isBareJid';

describe('isBareJid', () => {
	test.each([
		['alice@example.com'],
		['alice@localhost'],
		['a@b'],
		['alice@xmpp-1.example.com'],
		['nick#room@conference.example.com'],
		['josé@example.com'],
		['🚀@example.com'],
		['alice@exämple.com'],
		['alice@Example.COM'],
		['alice@127.0.0.1'],
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
		['alice@example.com..', 'two trailing dots'],
		['alice@.', 'only a dot'],
		['alice@exa_mple.com', 'underscore in domain'],
		['alice@example.com:5269', 'port'],
		['alice@[::1]', 'IP literal'],
		['alice@ex ample.com', 'space in domain'],
		['alice@example.com\u0001', 'control character at the end of the domain'],
		['alice@example.com\u001f', 'unit separator at the end of the domain'],
		[`${'é'.repeat(129)}@example.com`, 'node over 256 bytes'],
		[`alice@${'a.'.repeat(127)}ab`, 'domain over 255 bytes'],
	])('rejects %s (%s)', (value) => {
		expect(isBareJid(value)).toBe(false);
	});

	test.each([[undefined], [null], [42], [{}]])('rejects non-string %p', (value) => {
		expect(isBareJid(value)).toBe(false);
	});
});

describe('normalizeBareJid', () => {
	test.each([
		['alice@example.com', 'alice@example.com'],
		['Alice@Example.COM', 'Alice@example.com'],
		['alice@exämple.com', 'alice@xn--exmple-cua.com'],
		['alice@xn--exmple-cua.com', 'alice@xn--exmple-cua.com'],
		['alice@example.com.', 'alice@example.com'],
	])('spells %s as %s, keeping the node as typed', (value, expected) => {
		expect(normalizeBareJid(value)).toBe(expected);
	});

	test.each([['example.com'], ['alice@example.com/phone'], ['alice@example.com..'], [42]])('is undefined for %p', (value) => {
		expect(normalizeBareJid(value)).toBeUndefined();
	});
});
