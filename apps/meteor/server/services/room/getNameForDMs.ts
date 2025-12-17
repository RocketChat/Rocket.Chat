import type { AtLeast, IUser } from '@rocket.chat/core-typings';

const getFname = (members: AtLeast<IUser, 'name' | 'username'>[]): string | undefined => {
	if (members.length === 0) {
		return;
	}
	return members.map(({ name, username }) => name || username).join(', ');
};
const getName = (members: AtLeast<IUser, 'name' | 'username'>[]): string | undefined => {
	if (members.length === 0) {
		return;
	}
	return members.map(({ username }) => username).join(', ');
};

type NameMap = { [userId: string]: { fname: string; name: string } };

export function getNameForDMs(members: AtLeast<IUser, '_id' | 'name' | 'username'>[]): NameMap {
	const nameMap: NameMap = {};

	const sortedMembers = members.sort((u1, u2) => (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!));

	for (const member of sortedMembers) {
		const otherMembers = sortedMembers.filter((m) => m._id !== member._id);

		nameMap[member._id] = {
			fname: getFname(otherMembers) || member.name || member.username || '',
			name: getName(otherMembers) || member.username || '',
		};
	}

	return nameMap;
}
