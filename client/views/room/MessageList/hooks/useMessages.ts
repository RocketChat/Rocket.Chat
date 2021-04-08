import { useCallback } from 'react';

import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { IRoom } from '../../../../../definition/IRoom';
import { IMessage } from '../../../../../definition/IMessage';
import { ChatMessage } from '../../../../../app/models/client';
import { useUserPreference } from '../../../../contexts/UserContext';
import { useSetting } from '../../../../contexts/SettingsContext';

const options = {
	sort: {
		ts: 1,
	},
};


export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	const showInMainThread = useUserPreference<Boolean>('showMessageInMainThread', false);
	const hideSettings = !!useSetting('Hide_System_Messages');

	// const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });
	// const settingValues = Array.isArray(room.sysMes) ? room.sysMes : hideSettings || [];
	// const hideMessagesOfType = new Set(settingValues.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []));
	const query = {
		rid,
		_hidden: { $ne: true },
		...!showInMainThread && {
			$or: [
				{ tmid: { $exists: 0 } },
				{ tshow: { $eq: true } },
			],
		},
	};

	// if (hideMessagesOfType.size) {
	// 	query.t = { $nin: Array.from(hideMessagesOfType.values()) };
	// }

	return useReactiveValue<IMessage[]>(useCallback(() => ChatMessage.find(query, options).fetch(), [rid]));
}
