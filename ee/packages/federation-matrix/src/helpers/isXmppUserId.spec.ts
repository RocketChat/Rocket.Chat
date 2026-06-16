import { isXmppUserId } from './isXmppUserId';

describe('isXmppUserId', () => {
	it('should accept a prefixed MUC occupant id', () => {
		expect(isXmppUserId('_xmpp_prince=2fmychannel=40conference.xmpp.host')).toBe(true);
	});

	it('should accept a prefixed bare JID with no resource', () => {
		expect(isXmppUserId('_xmpp_alice=40xmpp.host')).toBe(true);
	});

	it('should reject a value without the bridge prefix', () => {
		expect(isXmppUserId('prince=2fmychannel=40conference.xmpp.host')).toBe(false);
	});

	it('should reject a normal username', () => {
		expect(isXmppUserId('john.doe')).toBe(false);
	});

	it('should reject a prefixed value that is not a JID (no domain)', () => {
		expect(isXmppUserId('_xmpp_justaname')).toBe(false);
	});

	it('should reject the bare prefix', () => {
		expect(isXmppUserId('_xmpp_')).toBe(false);
	});

	it('should reject a prefixed value with an empty local part', () => {
		expect(isXmppUserId('_xmpp_=40xmpp.host')).toBe(false);
	});

	it('should reject a prefixed value with an invalid domain', () => {
		expect(isXmppUserId('_xmpp_alice=40not_a_domain')).toBe(false);
	});

	it('should honour a custom prefix', () => {
		expect(isXmppUserId('_bifrost_alice=40xmpp.host', '_bifrost_')).toBe(true);
		expect(isXmppUserId('_xmpp_alice=40xmpp.host', '_bifrost_')).toBe(false);
	});

	it('should validate a bare escaped JID when prefix is empty', () => {
		expect(isXmppUserId('alice=40xmpp.host', '')).toBe(true);
		expect(isXmppUserId('justaname', '')).toBe(false);
	});
});
