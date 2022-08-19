import type { IRoom } from '@rocket.chat/core-typings';
import { IMessage } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
// import { useSetting } from '@rocket.chat/ui-contexts'
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

const options = {
	sort: {
		ts: 1,
	},
};

const isNotNullOrUndefined = (value: unknown): boolean => value !== null && value !== undefined;

// In a previous version of the app, some values were being set to null.
// This is a workaround to remove those null values.
// A migration script should be created to remove this code.
const removePossibleNullValues = ({
	editedBy,
	editedAt,
	emoji,
	avatar,
	alias,
	customFields,
	groupable,
	attachments,
	reactions,
	...message
}: any): IMessage => ({
	...message,
	...(isNotNullOrUndefined(editedBy) && { editedBy }),
	...(isNotNullOrUndefined(editedAt) && { editedAt }),
	...(isNotNullOrUndefined(emoji) && { emoji }),
	...(isNotNullOrUndefined(avatar) && { avatar }),
	...(isNotNullOrUndefined(alias) && { alias }),
	...(isNotNullOrUndefined(customFields) && { customFields }),
	...(isNotNullOrUndefined(groupable) && { groupable }),
	...(isNotNullOrUndefined(attachments) && { attachments }),
	...(isNotNullOrUndefined(reactions) && { reactions }),
});

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	// const hideSettings = !!useSetting('Hide_System_Messages');

	// const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });
	// const settingValues = Array.isArray(room.sysMes) ? room.sysMes : hideSettings || [];
	// const hideMessagesOfType = new Set(settingValues.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []));
	const query: Mongo.Query<IMessage> = useMemo(
		() => ({
			rid,
			_hidden: { $ne: true },
			$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
		}),
		[rid],
	);

	// if (hideMessagesOfType.size) {
	// 	query.t = { $nin: Array.from(hideMessagesOfType.values()) };
	// }

	return useReactiveValue<IMessage[]>(useCallback(() => ChatMessage.find(query, options).fetch().map(removePossibleNullValues), [query]));
};
