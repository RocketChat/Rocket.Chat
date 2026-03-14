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

	it('should consider users with post-readonly permission unmuted when they are not in readonly room muted list', () => {
		const user = { _id: 'uid', username: 'john' };
		const room = { ro: true, unmuted: [], muted: ['mary'] };

		expect(getUserIsMuted(user, room as any, true)).toBe(false);
	});
});
