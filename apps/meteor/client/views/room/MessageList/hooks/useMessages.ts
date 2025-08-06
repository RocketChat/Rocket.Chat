import type { IRoom, IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';

import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

import { Messages } from '../../../../stores';
import { useRoom } from '../../contexts/RoomContext';

const mergeHideSysMessages = (
	sysMesArray1: Array<MessageTypesValues>,
	sysMesArray2: Array<MessageTypesValues>,
): Array<MessageTypesValues> => {
	return Array.from(new Set([...sysMesArray1, ...sysMesArray2]));
};

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	const showThreadsInMainChannel = useUserPreference<boolean>('showThreadsInMainChannel', false);
	const hideSysMesSetting = useSetting<MessageTypesValues[]>('Hide_System_Messages', []);
	const room = useRoom();
	const hideRoomSysMes: Array<MessageTypesValues> = Array.isArray(room.sysMes) ? room.sysMes : [];

	const hideSysMessages = useStableArray(mergeHideSysMessages(hideSysMesSetting, hideRoomSysMes));

	const predicate = useMemo(
		() =>
			createPredicateFromFilter<IMessage>({
				rid,
				_hidden: { $ne: true },
				t: { $nin: hideSysMessages },
				...(!showThreadsInMainChannel && {
					$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
				}),
			}),
		[rid, hideSysMessages, showThreadsInMainChannel],
	);

	return Messages.use(useShallow((state) => state.filter(predicate).sort((a, b) => a.ts.getTime() - b.ts.getTime())));
};
