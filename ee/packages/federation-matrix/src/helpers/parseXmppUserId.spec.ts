import { decodeXmppUserId, isFullXmppUserId, parseXmppUserId } from './parseXmppUserId';

describe('decodeXmppUserId', () => {
	it('should decode the `=xx` escapes back to their characters', () => {
		expect(decodeXmppUserId('prince=2fmychannel=40conference.xmpp.host')).toBe('prince/mychannel@conference.xmpp.host');
	});

	it('should accept uppercase hex digits', () => {
		expect(decodeXmppUserId('a=2Fb=40d')).toBe('a/b@d');
	});

	it('should decode multi-byte UTF-8 characters', () => {
		// "é" is U+00E9 -> UTF-8 bytes 0xc3 0xa9
		expect(decodeXmppUserId('caf=c3=a9=40xmpp.host')).toBe('café@xmpp.host');
	});

	it('should leave a value without escapes untouched', () => {
		expect(decodeXmppUserId('justaname')).toBe('justaname');
	});
});

describe('isFullXmppUserId', () => {
	it('should accept a value with both `@` and `/`', () => {
		expect(isFullXmppUserId('prince/mychannel@conference.xmpp.host')).toBe(true);
	});

	it('should reject a bare JID with no resource', () => {
		expect(isFullXmppUserId('alice@xmpp.host')).toBe(false);
	});

	it('should reject a value with no domain separator', () => {
		expect(isFullXmppUserId('prince/mychannel')).toBe(false);
	});
});

describe('parseXmppUserId', () => {
	it('should split a MUC occupant id into resource, local and domain', () => {
		expect(parseXmppUserId('prince/mychannel@conference.xmpp.host')).toEqual({
			local: 'mychannel',
			domain: 'conference.xmpp.host',
			resource: 'prince',
			jid: 'mychannel@conference.xmpp.host/prince',
		});
	});

	it('should parse a bare JID with no resource', () => {
		expect(parseXmppUserId('alice@xmpp.host')).toEqual({
			local: 'alice',
			domain: 'xmpp.host',
			resource: undefined,
			jid: 'alice@xmpp.host',
		});
	});

	it('should keep a / that belongs to the resource', () => {
		expect(parseXmppUserId('a/b/mychannel@conference.xmpp.host')).toEqual({
			local: 'mychannel',
			domain: 'conference.xmpp.host',
			resource: 'a/b',
			jid: 'mychannel@conference.xmpp.host/a/b',
		});
	});

	it('should throw when there is no domain separator', () => {
		expect(() => parseXmppUserId('justaname')).toThrow('missing domain separator');
	});

	it('should throw when the local part is empty', () => {
		expect(() => parseXmppUserId('prince/@conference.xmpp.host')).toThrow('empty local or domain');
	});

	it('should throw when the domain is empty', () => {
		expect(() => parseXmppUserId('prince/mychannel@')).toThrow('empty local or domain');
	});

	it('should throw when both local and domain are empty', () => {
		expect(() => parseXmppUserId('@')).toThrow('empty local or domain');
	});

	it('should throw when a resource separator is present but the resource is empty', () => {
		expect(() => parseXmppUserId('/mychannel@conference.xmpp.host')).toThrow('empty resource');
	});
});
