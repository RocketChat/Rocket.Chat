import { mirroredRoomDisplayName, mirroredRoomName } from './remoteRoom';

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
