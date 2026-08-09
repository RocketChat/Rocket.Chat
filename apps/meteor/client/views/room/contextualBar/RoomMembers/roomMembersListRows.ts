import type { TranslationKey } from '@rocket.chat/ui-contexts';

import type { RoomMember } from '../../../hooks/useMembersList';

type RoomMembersRoleSection = {
	key: 'owners' | 'leaders' | 'moderators' | 'members';
	title: TranslationKey;
	matches: (member: RoomMember) => boolean;
};

export type RoomMembersDividerRow = {
	_id: `divider-${RoomMembersRoleSection['key']}`;
	type: 'divider';
	title: TranslationKey;
	count: number;
};

export type RoomMembersMemberRow = {
	_id: `member-${RoomMember['_id']}`;
	type: 'member';
	member: RoomMember;
	memberIndex: number;
};

export type RoomMembersListRow = RoomMembersDividerRow | RoomMembersMemberRow;

const roleSections: RoomMembersRoleSection[] = [
	{
		key: 'owners',
		title: 'Owners',
		matches: (member) => member.roles?.includes('owner') ?? false,
	},
	{
		key: 'leaders',
		title: 'Leaders',
		matches: (member) => member.roles?.includes('leader') ?? false,
	},
	{
		key: 'moderators',
		title: 'Moderators',
		matches: (member) => member.roles?.includes('moderator') ?? false,
	},
	{
		key: 'members',
		title: 'Members',
		matches: () => true,
	},
];

const defaultRoleSection = roleSections[roleSections.length - 1];

const getRoleSection = (member: RoomMember): RoomMembersRoleSection =>
	roleSections.find((section) => section.matches(member)) ?? defaultRoleSection;

export const buildRoomMembersListRows = (members: RoomMember[]): { rows: RoomMembersListRow[]; stickyIndexes: number[] } => {
	const groupedMembers = new Map<RoomMembersRoleSection['key'], { member: RoomMember; memberIndex: number }[]>();

	roleSections.forEach(({ key }) => groupedMembers.set(key, []));

	members.forEach((member, memberIndex) => {
		groupedMembers.get(getRoleSection(member).key)?.push({ member, memberIndex });
	});

	const rows: RoomMembersListRow[] = [];
	const stickyIndexes: number[] = [];

	roleSections.forEach(({ key, title }) => {
		const sectionMembers = groupedMembers.get(key) ?? [];

		if (sectionMembers.length === 0) {
			return;
		}

		stickyIndexes.push(rows.length);
		rows.push({
			_id: `divider-${key}`,
			type: 'divider',
			title,
			count: sectionMembers.length,
		});

		sectionMembers.forEach(({ member, memberIndex }) => {
			rows.push({
				_id: `member-${member._id}`,
				type: 'member',
				member,
				memberIndex,
			});
		});
	});

	return { rows, stickyIndexes };
};

export const findActiveStickyIndex = (stickyIndexes: readonly number[], visibleItemIndex: number): number => {
	if (stickyIndexes.length === 0) {
		return -1;
	}

	for (let i = stickyIndexes.length - 1; i >= 0; i--) {
		const stickyIndex = stickyIndexes[i];

		if (stickyIndex === undefined) {
			continue;
		}

		if (visibleItemIndex >= stickyIndex) {
			return stickyIndex;
		}
	}

	return stickyIndexes[0] ?? -1;
};
