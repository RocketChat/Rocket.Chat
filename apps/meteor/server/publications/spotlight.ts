import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { Spotlight } from '../lib/spotlight';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		spotlight(
			text: string,
			usernames?: string[],
			type?: {
				users?: boolean;
				rooms?: boolean;
				mentions?: boolean;
				includeFederatedRooms?: boolean;
			},
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

Meteor.methods<ServerMethods>({
	async spotlight(text, usernames = [], type = { users: true, rooms: true, mentions: false, includeFederatedRooms: false }, rid) {
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

		const { userId } = this;

		return {
			users: type.users ? await spotlight.searchUsers({ userId, rid, text, usernames, mentions }) : [],
			rooms: type.rooms ? await spotlight.searchRooms({ userId, text, includeFederatedRooms }) : [],
		};
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
