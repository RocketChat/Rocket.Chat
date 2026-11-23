import { localJidOf, localUsernameOf } from './jid';

describe('localJidOf', () => {
	it('escapes a username a localpart cannot carry (addressing R1)', () => {
		expect(localJidOf("o'quote", 'rc.example')).toBe('o\\27quote@rc.example');
		expect(localJidOf('alice@corp.example', 'rc.example')).toBe('alice\\40corp.example@rc.example');
		expect(localJidOf('alice', 'rc.example')).toBe('alice@rc.example');
	});
});

describe('localUsernameOf', () => {
	it('unescapes the localpart of a full or bare JID (addressing R1)', () => {
		expect(localUsernameOf('o\\27quote@rc.example/res')).toBe("o'quote");
		expect(localUsernameOf('alice\\40corp.example@rc.example')).toBe('alice@corp.example');
		expect(localUsernameOf('alice@rc.example')).toBe('alice');
	});

	it('returns the username localJidOf escaped (addressing R1)', () => {
		for (const username of ["o'quote", 'a b', 'x@y.example', 'back\\20slash', 'plain']) {
			expect(localUsernameOf(localJidOf(username, 'rc.example'))).toBe(username);
		}
	});
});
