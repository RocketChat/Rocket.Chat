import type { DropRoom } from './getRoomDropTarget';
import { getRoomDropTarget } from './getRoomDropTarget';
import { FAVORITES_TARGET } from '../categories/hooks/useUserSidebarCategories';

const context = {
	customCategoryIds: ['work', 'clients'],
	groupKeys: ['Unread', 'Favorites', 'work', 'clients', 'Channels', 'Direct_Messages'],
	isFavoritesEnabled: true,
};

const channel: DropRoom = { t: 'c' };

describe('getRoomDropTarget', () => {
	it('does nothing when the room is dropped on the group it is listed in', () => {
		expect(getRoomDropTarget(channel, 'Channels', 'Channels', context)).toBeUndefined();
		expect(getRoomDropTarget({ ...channel, category: 'work' }, 'work', 'work', context)).toBeUndefined();
	});

	it('moves the room into a custom category', () => {
		expect(getRoomDropTarget(channel, 'Channels', 'work', context)).toBe('work');
	});

	it('moves the room into Favorites only while favorites are enabled', () => {
		expect(getRoomDropTarget(channel, 'Channels', 'Favorites', context)).toBe(FAVORITES_TARGET);
		expect(getRoomDropTarget(channel, 'Channels', 'Favorites', { ...context, isFavoritesEnabled: false })).toBeUndefined();
	});

	describe('from a dynamic group', () => {
		it('moves the room into another category', () => {
			expect(getRoomDropTarget({ ...channel, category: 'work' }, 'Unread', 'clients', context)).toBe('clients');
		});

		it('does nothing when dropped on the category the room already belongs to', () => {
			expect(getRoomDropTarget({ ...channel, category: 'work' }, 'Unread', 'work', context)).toBeUndefined();
			expect(getRoomDropTarget({ ...channel, category: 'work' }, 'Incoming_Calls', 'work', context)).toBeUndefined();
		});

		it('does nothing when a favorite is dropped on Favorites', () => {
			expect(getRoomDropTarget({ ...channel, f: true }, 'Unread', 'Favorites', context)).toBeUndefined();
		});
	});

	it('takes a favorite, or a room listed in a dynamic group, out of its category when dropped on its own system group', () => {
		expect(getRoomDropTarget({ ...channel, f: true }, 'Favorites', 'Channels', context)).toBeNull();
		expect(getRoomDropTarget({ ...channel, category: 'work' }, 'Unread', 'Channels', context)).toBeNull();
	});

	it.each<[string, DropRoom]>([
		['Teams', { t: 'c', teamMain: true }],
		['Discussions', { t: 'p', prid: 'parent' }],
		['Channels', { t: 'p' }],
		['Direct_Messages', { t: 'd' }],
	])('takes the room out of its category when dropped on %s, its own system group', (systemGroup, room) => {
		const grouped = { ...context, groupKeys: ['work', 'Teams', 'Discussions', 'Channels', 'Direct_Messages'] };
		expect(getRoomDropTarget({ ...room, category: 'work' }, 'work', systemGroup, grouped)).toBeNull();
	});

	it('treats a discussion as listed under Channels when the Discussions group is not shown', () => {
		const withoutDiscussions = { ...context, groupKeys: ['work', 'Teams', 'Channels', 'Direct_Messages'] };
		const discussion: DropRoom = { t: 'c', prid: 'parent', category: 'work' };
		expect(getRoomDropTarget(discussion, 'work', 'Channels', withoutDiscussions)).toBeNull();
		expect(getRoomDropTarget({ ...discussion, t: 'd' }, 'work', 'Direct_Messages', withoutDiscussions)).toBeNull();
	});

	it('falls back to Conversations as the system group when rooms are not grouped by type', () => {
		const ungrouped = { ...context, groupKeys: ['Favorites', 'work', 'Conversations'] };
		expect(getRoomDropTarget({ ...channel, category: 'work' }, 'work', 'Conversations', ungrouped)).toBeNull();
	});

	it('does nothing when the room is dropped on a system group other than its own', () => {
		expect(getRoomDropTarget({ ...channel, category: 'work' }, 'work', 'Direct_Messages', context)).toBeUndefined();
	});

	it('does nothing when a room without a category is dropped on its own system group from a dynamic group', () => {
		expect(getRoomDropTarget(channel, 'Unread', 'Channels', context)).toBeUndefined();
	});

	it('never moves an omnichannel room', () => {
		const livechat: DropRoom = { t: 'l' };
		expect(getRoomDropTarget(livechat, 'Open_Livechats', 'work', context)).toBeUndefined();
		expect(getRoomDropTarget(livechat, 'On_Hold_Chats', 'Favorites', context)).toBeUndefined();
	});
});
