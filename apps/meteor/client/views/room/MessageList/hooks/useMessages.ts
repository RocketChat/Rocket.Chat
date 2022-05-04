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
	...(editedBy !== null && { editedBy }),
	...(editedAt !== null && { editedAt }),
	...(emoji !== null && { emoji }),
	...(avatar !== null && { avatar }),
	...(alias !== null && { alias }),
	...(customFields !== null && { customFields }),
	...(groupable !== null && { groupable }),
	...(attachments !== null && { attachments }),
	...(reactions !== null && { reactions }),
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
