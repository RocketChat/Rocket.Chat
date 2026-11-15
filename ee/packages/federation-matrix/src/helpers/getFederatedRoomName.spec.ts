import { getFederatedRoomName } from './getFederatedRoomName';

describe('getFederatedRoomName', () => {
	it('should strip the leading `!` sigil and replace the `:` separator with `_`', () => {
		expect(getFederatedRoomName('!abcdef:matrix.org')).toBe('abcdef_matrix.org');
	});

	it('should produce a slug-valid name (only [0-9a-zA-Z-_.])', () => {
		expect(getFederatedRoomName('!abcdef:matrix.org')).toMatch(/^[0-9a-zA-Z-_.]+$/);
	});

	it('should handle server names with a port (multiple `:`)', () => {
		expect(getFederatedRoomName('!abcdef:matrix.org:8448')).toBe('abcdef_matrix.org_8448');
	});

	it('should replace slug-invalid characters in the opaque id', () => {
		expect(getFederatedRoomName('!ab+cd/ef=:matrix.org')).toBe('ab_cd_ef__matrix.org');
		expect(getFederatedRoomName('!ab+cd/ef=:matrix.org')).toMatch(/^[0-9a-zA-Z-_.]+$/);
	});

	it('should only strip a `!` at the start, not elsewhere', () => {
		expect(getFederatedRoomName('!ab!cd:matrix.org')).toBe('ab_cd_matrix.org');
	});

	it('should be deterministic for the same room id', () => {
		expect(getFederatedRoomName('!room:server.com')).toBe(getFederatedRoomName('!room:server.com'));
	});

	it('should derive distinct names for distinct room ids', () => {
		expect(getFederatedRoomName('!a:server.com')).not.toBe(getFederatedRoomName('!b:server.com'));
	});
});
