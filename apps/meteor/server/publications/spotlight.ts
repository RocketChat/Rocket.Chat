import { Spotlight } from '../lib/spotlight';
import { getUsersHiddenFrom, redactHiddenUsers } from '../lib/statusVisibility/hiddenUsers';

type SpotlightType = {
	users?: boolean;
	rooms?: boolean;
	mentions?: boolean;
	includeFederatedRooms?: boolean;
};

export const spotlightMethod = async ({
	text,
	usernames = [],
	type = { users: true, rooms: true, mentions: false, includeFederatedRooms: false },
	rid,
	userId,
}: {
	text: string;
	usernames?: string[];
	type?: SpotlightType;
	rid?: string;
	userId?: string | null;
}) => {
	const spotlight = new Spotlight();
	const { mentions, includeFederatedRooms } = type;

	if (text.startsWith('#')) {
		type.users = false;
		text = text.slice(1);
	}

	if (text.startsWith('@')) {
		type.rooms = false;
		text = text.slice(1);
	}

	const [users, rooms] = await Promise.all([
		type.users ? spotlight.searchUsers({ userId, rid, text, usernames, mentions }) : [],
		type.rooms ? spotlight.searchRooms({ userId, text, includeFederatedRooms }) : [],
	]);

	const hidden = await getUsersHiddenFrom(userId);

	return { users: redactHiddenUsers(users, hidden), rooms };
};
