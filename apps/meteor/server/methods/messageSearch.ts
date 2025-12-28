import type { ISubscription, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Subscriptions } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';
import type { IRawSearchResult } from '../../app/search/server/model/ISearchResult';
import { settings } from '../../app/settings/server';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';
import { parseMessageSearchQuery } from '../lib/parseMessageSearchQuery';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		messageSearch(text: string, rid?: string, limit?: number, offset?: number): IRawSearchResult | false;
	}
}

export const messageSearch = async function (
	userId: string,
	text: string,
	rid?: string,
	limit?: number,
	offset?: number,
): Promise<IRawSearchResult | false> {
	check(text, String);
	check(rid, Match.Maybe(String));
	check(limit, Match.Optional(Number));
	check(offset, Match.Optional(Number));

	// Don't process anything else if the user can't access the room
	if (rid) {
		if (!(await canAccessRoomIdAsync(rid, userId))) {
			return false;
		}
	} else if (settings.get('Search.defaultProvider.GlobalSearchEnabled') !== true) {
		return {
			message: {
				docs: [],
			},
		};
	}

	const user = (await Meteor.userAsync()) as IUser | undefined;

	const { query, options } = parseMessageSearchQuery(text, {
		user,
		offset,
		limit,
		forceRegex: settings.get('Message_AlwaysSearchRegExp'),
	});

	if (Object.keys(query).length === 0) {
		return {
			message: {
				docs: [],
			},
		};
	}

	query.t = {
		$ne: 'rm', // hide removed messages (useful when searching for user messages)
	};
	query._hidden = {
		$ne: true, // don't return _hidden messages
	};

	if (rid) {
		query.rid = rid;
	} else {
		query.rid = {
			$in: user?._id ? (await Subscriptions.findByUserId(user._id).toArray()).map((subscription: ISubscription) => subscription.rid) : [],
		};
	}

	return {
		message: {
			docs: await Messages.find(query, {
				// @ts-expect-error col.s.db is not typed
				readPreference: readSecondaryPreferred(Messages.col.s.db),
				...options,
			}).toArray(),
		},
	};
};

Meteor.methods<ServerMethods>({
	async messageSearch(text, rid, limit, offset) {
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messageSearch',
			});
		}

		return messageSearch(currentUserId, text, rid, limit, offset);
	},
});
