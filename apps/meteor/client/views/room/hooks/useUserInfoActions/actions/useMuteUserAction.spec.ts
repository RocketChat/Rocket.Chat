import { getUserIsMuted } from './getUserIsMuted';

describe('getUserIsMuted', () => {
	it('should consider users muted by default in readonly rooms', () => {
		const user = { _id: 'uid', username: 'john' };
		const room = { ro: true, unmuted: [], muted: [] };

		expect(getUserIsMuted(user, room as any, true)).toBe(true);
	});

	it('should consider users unmuted when they are listed in readonly room unmuted list', () => {
		const user = { _id: 'uid', username: 'john' };
		const room = { ro: true, unmuted: ['john'], muted: [] };

		expect(getUserIsMuted(user, room as any, true)).toBe(false);
	});
});
