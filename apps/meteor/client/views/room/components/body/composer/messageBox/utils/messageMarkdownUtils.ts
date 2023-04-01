import type { IRoom } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import { parse } from '@rocket.chat/message-parser';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { Subscriptions } from '../../../../../../../../app/models/client';
import { usersFromRoomMessages } from '../../../../../../../../app/ui-message/client/popup/messagePopupConfig';

// TODO get pattern from proper place
const pattern = '[0-9a-zA-Z-_.]+';
const userMentionRegex = () => {
	return new RegExp(`(^|\\s|> ?)@(${pattern}(@(${pattern}))?(:([0-9a-zA-Z-_.]+))?)`, 'gm');
};

const channelMentionRegex = () => {
	return new RegExp(`(^|\\s|>)#(${pattern}(@(${pattern}))?)`, 'gm');
};

export const getUserMentions = (str: string) => {
	return (str.match(userMentionRegex()) || []).map((match) => match.trim().substr(1));
};

export const getChannelMentions = (str: string) => {
	return (str.match(channelMentionRegex()) || []).map((match) => match.trim().substr(1));
};

export const getUser = async (filter: string, rid: IRoom['_id'], userSpotlight: any) => {
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
	return users.map(({ _id, username, name }: { _id: string; username: string; name: string }) => {
		return {
			_id,
			username,
			name,
		};
	})[0];
};

export const getChannel = (filter: string) => {
	const filterRegex = new RegExp(escapeRegExp(filter), 'i');
	// console.log(filterRegex)
	const records = Subscriptions.find(
		{
			name: filterRegex,
			$or: [{ federated: { $exists: false } }, { federated: false }],
			t: {
				$in: ['c', 'p'],
			},
		},
		{ fields: { _id: 1, name: 1, fname: 1 } },
	).fetch();
	if (!records) {
		return;
	}
	return records[0];
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
