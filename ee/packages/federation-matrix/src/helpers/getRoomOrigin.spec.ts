import { getRoomOrigin } from './getRoomOrigin';

const createEvent = (sender: string) => ({ type: 'm.room.create', sender });

describe('getRoomOrigin', () => {
	describe('room versions 1 to 11', () => {
		it('should return the server named by the room id', () => {
			expect(getRoomOrigin('!abcdef:matrix.org', undefined)).toBe('matrix.org');
		});

		it('should keep the port of the server named by the room id', () => {
			expect(getRoomOrigin('!abcdef:matrix.org:8448', undefined)).toBe('matrix.org:8448');
		});

		it('should prefer the room id over the unsigned stripped create event', () => {
			expect(getRoomOrigin('!abcdef:matrix.org', [createEvent('@mallory:evil.org')])).toBe('matrix.org');
		});
	});

	describe('room version 12', () => {
		it('should return the server of the create event sender', () => {
			expect(getRoomOrigin('!tr-qUAoHashOnly', [{ type: 'm.room.name', sender: '@bob:other.org' }, createEvent('@alice:matrix.org')])).toBe(
				'matrix.org',
			);
		});

		it('should keep the port of the create event sender', () => {
			expect(getRoomOrigin('!tr-qUAoHashOnly', [createEvent('@alice:matrix.org:8448')])).toBe('matrix.org:8448');
		});

		it('should throw when the stripped state has no create event', () => {
			expect(() => getRoomOrigin('!tr-qUAoHashOnly', [])).toThrow('Room origin not found');
			expect(() => getRoomOrigin('!tr-qUAoHashOnly', undefined)).toThrow('Room origin not found');
		});
	});
});
