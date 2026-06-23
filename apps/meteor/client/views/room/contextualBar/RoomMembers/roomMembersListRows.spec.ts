import { buildRoomMembersListRows, findActiveStickyIndex } from './roomMembersListRows';
import type { RoomMember } from '../../../hooks/useMembersList';

const member = (_id: string, roles: string[] = []): RoomMember =>
	({
		_id,
		username: _id,
		roles,
		subscription: {
			_id: `subscription-${_id}`,
			ts: '2026-01-01T00:00:00.000Z',
		},
	}) as RoomMember;

describe('roomMembersListRows', () => {
	it('returns no rows when there are no loaded members', () => {
		expect(buildRoomMembersListRows([])).toEqual({ rows: [], stickyIndexes: [] });
	});

	it('builds divider and member rows in role order with loaded counts', () => {
		const { rows, stickyIndexes } = buildRoomMembersListRows([
			member('normal-1'),
			member('owner-1', ['owner']),
			member('moderator-1', ['moderator']),
			member('leader-1', ['leader']),
			member('normal-2'),
		]);

		expect(stickyIndexes).toEqual([0, 2, 4, 6]);
		expect(rows.map((row) => row._id)).toEqual([
			'divider-owners',
			'member-owner-1',
			'divider-leaders',
			'member-leader-1',
			'divider-moderators',
			'member-moderator-1',
			'divider-members',
			'member-normal-1',
			'member-normal-2',
		]);
		expect(rows.filter((row) => row.type === 'divider').map((row) => row.count)).toEqual([1, 1, 1, 2]);
	});

	it('uses the highest-priority role when a member has multiple roles', () => {
		const { rows } = buildRoomMembersListRows([member('multi-role', ['moderator', 'owner', 'leader'])]);

		expect(rows.map((row) => row._id)).toEqual(['divider-owners', 'member-multi-role']);
	});

	it('only renders loaded role sections that have members', () => {
		const { rows, stickyIndexes } = buildRoomMembersListRows([member('leader-1', ['leader'])]);

		expect(stickyIndexes).toEqual([0]);
		expect(rows.map((row) => row._id)).toEqual(['divider-leaders', 'member-leader-1']);
	});

	it('finds the latest sticky divider at or before the visible item index', () => {
		expect(findActiveStickyIndex([0, 4, 8], 0)).toBe(0);
		expect(findActiveStickyIndex([0, 4, 8], 6)).toBe(4);
		expect(findActiveStickyIndex([0, 4, 8], 12)).toBe(8);
	});

	it('returns the first sticky divider before it has a measured visible item', () => {
		expect(findActiveStickyIndex([0, 4], -1)).toBe(0);
		expect(findActiveStickyIndex([], 3)).toBe(-1);
	});
});
