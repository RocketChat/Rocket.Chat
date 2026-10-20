import { legacyLiveKitIdentityFor, liveKitRoomAliasFor, sfuGetLiveKitIdentityFor } from './derive';

// Test vectors from element-hq/lk-jwt-service (src/helper.rs), so tokens we mint name the rooms and identities
// other implementations expect.
describe('MatrixRTC LiveKit derivations', () => {
	it('derives the room alias of a session', () => {
		expect(liveKitRoomAliasFor('!roomid:example.com', 'slot1234')).toBe('O8437W3+jmzMVjoIP3tNwbm+XxHQk2iKpOA7aqw3qSc');
	});

	it('derives the identity of a member admitted through /get_token', () => {
		expect(legacyLiveKitIdentityFor('@alice:example.com', 'DEVICE123', 'memberABC')).toBe('J+T45tGruxc+HrUOqJJlyQSV33m728Cme4+vt8/SWrU');
	});

	it('derives the identity of a member admitted through /sfu/get', () => {
		expect(sfuGetLiveKitIdentityFor('@alice:example.com', 'DEVICE123')).toBe('@alice:example.com:DEVICE123');
	});
});
