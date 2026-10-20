import { mirroredRoomDisplayName, mirroredRoomName, perRoomOccupantJid } from './remoteRoom';

describe('mirroredRoomName', () => {
	it('is the room JID with characters a room name may not hold replaced, plus a hash of the JID (remote-muc R1)', () => {
		expect(mirroredRoomName('dev@conference.a.example')).toMatch(/^dev_conference\.a\.example-[0-9a-f]{8}$/);
	});

	it('is the same for the same room JID', () => {
		expect(mirroredRoomName('dev@conference.a.example')).toBe(mirroredRoomName('dev@conference.a.example'));
	});

	it('differs between room JIDs that read the same once characters are replaced (remote-muc R1)', () => {
		expect(mirroredRoomName('café@muc.example')).not.toBe(mirroredRoomName('cafè@muc.example'));
		expect(mirroredRoomName('会议@muc.example')).not.toBe(mirroredRoomName('聊天@muc.example'));
		expect(mirroredRoomName('a+b@muc.example')).not.toBe(mirroredRoomName('a_b@muc.example'));
	});
});

describe('mirroredRoomDisplayName', () => {
	it('shows the localpart and the MUC domain as `<localpart>:<domain>` (remote-muc R1)', () => {
		expect(mirroredRoomDisplayName('dev@conference.a.example')).toBe('dev:conference.a.example');
		expect(mirroredRoomDisplayName('café@muc.example')).toBe('café:muc.example');
	});
});

describe('perRoomOccupantJid', () => {
	it('is `<nick>#<room JID>` (addressing R9)', () => {
		expect(perRoomOccupantJid('ally', 'dev@conference.a.example')).toBe('ally#dev@conference.a.example');
	});

	it('escapes the nick, so no nick turns the key into another address (addressing R11)', () => {
		expect(perRoomOccupantJid('admin/x', 'dev@conference.a.example')).toBe('admin\\2fx#dev@conference.a.example');
		expect(perRoomOccupantJid('a@b', 'dev@conference.a.example')).toBe('a\\40b#dev@conference.a.example');
	});

	it('gives distinct keys to nick and room pairs that would join to the same text (addressing R9)', () => {
		expect(perRoomOccupantJid('a#b', 'c@conference.a.example')).toBe('a\\23b#c@conference.a.example');
		expect(perRoomOccupantJid('a#b', 'c@conference.a.example')).not.toBe(perRoomOccupantJid('a', 'b#c@conference.a.example'));
		expect(perRoomOccupantJid('a\\23b', 'c@conference.a.example')).not.toBe(perRoomOccupantJid('a#b', 'c@conference.a.example'));
	});
});
