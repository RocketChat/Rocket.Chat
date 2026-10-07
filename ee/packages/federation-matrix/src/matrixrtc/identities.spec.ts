import { localLiveKitIdentityFor, remoteLiveKitIdentitiesFor } from './identities';

// Test vectors from protocol.md §4.3, the identities each client generation derives (§4.1).
const MEMBER = { userId: '@alice:example.com', deviceId: 'DEVICE123', memberId: '2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10' };
const PLAIN = '@alice:example.com:DEVICE123';
const THREE_TUPLE = 'vu2cNfg0JmLFFMg3dVov9ejilJ/kWq/40z2RuIpNTTI';
const TWO_TUPLE = 'HaRsr5rY9z52KIMdxrnPOEeAPIt6HIUgHT3jM32cSPU';

const serviceUrl = 'https://example.com/livekit/jwt';
const url = 'wss://sfu.example.com';

describe('LiveKit identities of this server users', () => {
	it.each([
		['compatibility', PLAIN],
		['matrix_2_0', THREE_TUPLE],
		['matrix_2_0_msc4195', TWO_TUPLE],
	] as const)('mints, in %s, the identity deployed readers of that form expect', (profile, identity) => {
		expect(localLiveKitIdentityFor(profile, MEMBER)).toBe(identity);
	});
});

describe('LiveKit identities of other servers members', () => {
	it('knows a compatibility member naming a token service by one identity in every generation', () => {
		expect(remoteLiveKitIdentitiesFor({ ...MEMBER, form: 'compatibility', transport: { type: 'livekit', serviceUrl } })).toEqual({
			livekitIdentity: PLAIN,
			livekitIdentityAliases: [],
		});
	});

	it('also expects, of a compatibility member naming an SFU, the in-flight hash of its membership id', () => {
		const membershipId = '@alice:example.com:DEVICE123';

		expect(
			remoteLiveKitIdentitiesFor({ ...MEMBER, memberId: membershipId, form: 'compatibility', transport: { type: 'livekit', url } }),
		).toEqual({ livekitIdentity: PLAIN, livekitIdentityAliases: ['R3GraH1zZLeqwpdAOP4cr2LmH80XIMCoYcY8Xi95wzI'] });
	});

	it('expects a Matrix 2.0 member naming a token service as deployed Element Call does, and as the in-flight one does', () => {
		expect(remoteLiveKitIdentitiesFor({ ...MEMBER, form: 'matrix_2_0', transport: { type: 'livekit', serviceUrl } })).toEqual({
			livekitIdentity: THREE_TUPLE,
			livekitIdentityAliases: [PLAIN],
		});
	});

	it('expects a Matrix 2.0 member naming an SFU as MSC4195 does', () => {
		expect(remoteLiveKitIdentitiesFor({ ...MEMBER, form: 'matrix_2_0', transport: { type: 'livekit', url } })).toEqual({
			livekitIdentity: TWO_TUPLE,
			livekitIdentityAliases: [],
		});
	});

	it('accepts every candidate of a Matrix 2.0 member naming both', () => {
		expect(remoteLiveKitIdentitiesFor({ ...MEMBER, form: 'matrix_2_0', transport: { type: 'livekit', url, serviceUrl } })).toEqual({
			livekitIdentity: THREE_TUPLE,
			livekitIdentityAliases: [PLAIN, TWO_TUPLE],
		});
	});
});
