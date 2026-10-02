import { canMoveGroup } from './reorderableGroups';

jest.mock('./sidebarGroups', () => ({
	SIDEBAR_DYNAMIC_GROUP_KEYS: ['Unread', 'Favorites'],
}));

const groups = (...keys: string[]) => keys.map((key) => ({ key }));

describe('canMoveGroup', () => {
	it('never moves a dynamic group, in either direction', () => {
		const list = groups('Unread', 'Channels', 'Direct_Messages');

		expect(canMoveGroup(list, 0, 'up')).toBe(false);
		expect(canMoveGroup(list, 0, 'down')).toBe(false);
	});

	it('moves a group down while something follows it', () => {
		const list = groups('Channels', 'Direct_Messages');

		expect(canMoveGroup(list, 0, 'down')).toBe(true);
		expect(canMoveGroup(list, 1, 'down')).toBe(false);
	});

	it('moves a group up only past another group that can hold a position', () => {
		const list = groups('Channels', 'Direct_Messages');

		expect(canMoveGroup(list, 1, 'up')).toBe(true);
		expect(canMoveGroup(list, 0, 'up')).toBe(false);
	});

	it('does not count a dynamic group as somewhere to move up past', () => {
		const list = groups('Unread', 'Favorites', 'Channels');

		expect(canMoveGroup(list, 2, 'up')).toBe(false);
	});

	it('moves up past a static group sitting behind dynamic ones', () => {
		const list = groups('Unread', 'Channels', 'Direct_Messages');

		expect(canMoveGroup(list, 2, 'up')).toBe(true);
	});
});
