import type { ServerMethods } from '@rocket.chat/ddp-client';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { Spotlight } from '../lib/spotlight';

type SpotlightType = {
	users?: boolean;
	rooms?: boolean;
	mentions?: boolean;
	includeFederatedRooms?: boolean;
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		spotlight(
			text: string,
			usernames?: string[],
			type?: SpotlightType,
			rid?: string,
		): {
			rooms: { _id: string; name: string; t: string; uids?: string[] }[];
			users: {
				_id: string;
				status: 'offline' | 'online' | 'busy' | 'away';
				name: string;
				username: string;
				outside: boolean;
				avatarETag?: string;
				nickname?: string;
			}[];
		};
	}
}

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

	return {
		users: type.users ? await spotlight.searchUsers({ userId, rid, text, usernames, mentions }) : [],
		rooms: type.rooms ? await spotlight.searchRooms({ userId, text, includeFederatedRooms }) : [],
	};
};

Meteor.methods<ServerMethods>({
	async spotlight(text, usernames = [], type = { users: true, rooms: true, mentions: false, includeFederatedRooms: false }, rid) {
		return spotlightMethod({ text, usernames, type, rid, userId: this.userId });
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'spotlight',
		userId(/* userId*/) {
			return true;
		},
	},
	100,
	100000,
);
