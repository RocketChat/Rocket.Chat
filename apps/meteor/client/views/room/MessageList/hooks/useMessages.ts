import type { IRoom } from '@rocket.chat/core-typings';
import { IMessage } from '@rocket.chat/core-typings';
import { useCallback, useMemo } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
// import { useSetting } from '../../../../contexts/SettingsContext';
import { useUserPreference } from '../../../../contexts/UserContext';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

const options = {
	sort: {
		ts: 1,
	},
};

// In a previous version of the app, some values were being set to null instead of undefined.
// This is a workaround to remove those null values.
// A migration script should be created to remove this code.
const ifNullUndefined = <T extends any>(value: T): T | undefined => (value === null ? undefined : value);

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
	editedBy: ifNullUndefined(editedBy),
	editedAt: ifNullUndefined(editedAt),
	emoji: ifNullUndefined(emoji),
	avatar: ifNullUndefined(avatar),
	alias: ifNullUndefined(alias),
	customFields: ifNullUndefined(customFields),
	groupable: ifNullUndefined(groupable),
	attachments: ifNullUndefined(attachments),
	reactions: ifNullUndefined(reactions),
});

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	const showInMainThread = useUserPreference<boolean>('showMessageInMainThread', false);
	// const hideSettings = !!useSetting('Hide_System_Messages');

	// const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });
	// const settingValues = Array.isArray(room.sysMes) ? room.sysMes : hideSettings || [];
	// const hideMessagesOfType = new Set(settingValues.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []));
	const query = useMemo(
		() => ({
			rid,
			_hidden: { $ne: true },
			...(!showInMainThread && {
				$or: [{ tmid: { $exists: 0 } }, { tshow: { $eq: true } }],
			}),
		}),
		[rid, showInMainThread],
	);

	// if (hideMessagesOfType.size) {
	// 	query.t = { $nin: Array.from(hideMessagesOfType.values()) };
	// }

	return useReactiveValue<IMessage[]>(useCallback(() => ChatMessage.find(query, options).fetch().map(removePossibleNullValues), [query]));
};
