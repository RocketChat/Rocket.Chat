import { localLiveKitIdentityFor, remoteLiveKitIdentitiesFor } from './identities';

// Test vectors from protocol.md §4.3, the identities each client generation derives (§4.1).
const MEMBER = { userId: '@alice:example.com', deviceId: 'DEVICE123', memberId: '2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10' };
const PLAIN = '@alice:example.com:DEVICE123';
const THREE_TUPLE = 'vu2cNfg0JmLFFMg3dVov9ejilJ/kWq/40z2RuIpNTTI';

describe('LiveKit identities of this server users', () => {
	it.each([
		['compatibility', PLAIN],
		['matrix_2_0', THREE_TUPLE],
	] as const)('mints, in %s, the identity deployed readers of that form expect', (profile, identity) => {
		expect(localLiveKitIdentityFor(profile, MEMBER)).toBe(identity);
	});
});

describe('LiveKit identities of other servers members', () => {
	it('knows a compatibility member by one identity in every generation', () => {
		expect(remoteLiveKitIdentitiesFor({ ...MEMBER, form: 'compatibility' })).toEqual({
			livekitIdentity: PLAIN,
			livekitIdentityAliases: [],
		});
	});

	it('expects a Matrix 2.0 member as deployed Element Call does, and as the in-flight one does', () => {
		expect(remoteLiveKitIdentitiesFor({ ...MEMBER, form: 'matrix_2_0' })).toEqual({
			livekitIdentity: THREE_TUPLE,
			livekitIdentityAliases: [PLAIN],
		});
	});
});
