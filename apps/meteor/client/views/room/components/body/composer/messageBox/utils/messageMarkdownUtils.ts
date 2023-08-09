import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethodFunction } from '@rocket.chat/ddp-client/src/types/methods';
import type { Options, Root } from '@rocket.chat/message-parser';
import { parse } from '@rocket.chat/message-parser';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { Subscriptions } from '../../../../../../../../app/models/client';
import { usersFromRoomMessages } from '../../../../../../../../app/ui-message/client/popup/messagePopupConfig';

export type UserMention = {
	_id: string;
	username: string;
	name: string;
};

const MENTION_PATTERN = '[0-9a-zA-Z-_.]+';

const createUserMentionRegex = () => new RegExp(`(^|\\s|> ?)@(${MENTION_PATTERN}(@(${MENTION_PATTERN}))?(:([0-9a-zA-Z-_.]+))?)`, 'gm');

const createChannelMentionRegex = () => new RegExp(`(^|\\s|>)#(${MENTION_PATTERN}(@(${MENTION_PATTERN}))?)`, 'gm');

export const getUserMentions = (str: string): string[] =>
	(str.match(createUserMentionRegex()) || []).map((match) => match.trim().substr(1));

export const getChannelMentions = (str: string): string[] =>
	(str.match(createChannelMentionRegex()) || []).map((match) => match.trim().substr(1));

// Retrieves user information based on a filter
export const getUser = async (
	filter: string,
	rid: IRoom['_id'],
	userSpotlight: ServerMethodFunction<'spotlight'>,
): Promise<UserMention | undefined> => {
	if (filter === 'all' || filter === 'here') {
		return;
	}

	const filterRegex = filter && new RegExp(escapeRegExp(filter), 'i');
	const usernames = usersFromRoomMessages
		.find({
			ts: { $exists: true },
			...(filter && {
				$or: [{ username: filterRegex }, { name: filterRegex }],
			}),
		})
		.fetch()
		.map((u) => {
			return u.username;
		});

	if (!usernames) {
		return;
	}

	const { users = [] } = await userSpotlight(filter, usernames, { users: true, mentions: true }, rid);

	return users[0] ? { _id: users[0]._id, username: users[0].username, name: users[0].name } : undefined;
};

// Retrieves channel information based on a filter
export const getChannel = (filter: string) => {
	const filterRegex = new RegExp(escapeRegExp(filter), 'i');
	const [record] = Subscriptions.find(
		{
			name: filterRegex,
			$or: [{ federated: { $exists: false } }, { federated: false }],
			t: {
				$in: ['c', 'p'],
			},
		},
		{ fields: { _id: 1, name: 1, fname: 1 } },
	).fetch();

	if (!record) {
		return;
	}

	return record;
};

const isParsedMessage = (text: string | Root): text is Root => Array.isArray(text) && text.length > 0;

export const textToMessageToken = (text: string | undefined, parseOptions: Options): Root => {
	if (!text) {
		return [];
	}

	if (isParsedMessage(text)) {
		return text;
	}

	const parsedMessage = parse(text, parseOptions);

	const parsedMessageCleaned = parsedMessage[0].type !== 'LINE_BREAK' ? parsedMessage : (parsedMessage.slice(1) as Root);

	return parsedMessageCleaned;
};
