import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useCallback } from 'react';

import { Messages } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useBlazePortals } from '../../../../lib/portals/blazePortals';
import { useLegacyMessageRef } from './useLegacyMessageRef';

type LegacyMessageTemplateListProps = {
	room: IRoom;
};

const LegacyMessageTemplateList = ({ room }: LegacyMessageTemplateListProps): ReactElement => {
	const hideSystemMessages = useSetting('Hide_System_Messages') as MessageTypesValues[];

	const messagesHistory = useReactiveValue(
		useCallback(() => {
			const settingValues = Array.isArray(room?.sysMes) ? (room.sysMes as MessageTypesValues[]) : hideSystemMessages || [];
			const hideMessagesOfType = new Set(
				settingValues.reduce(
					(array: MessageTypesValues[], value: MessageTypesValues) => [
						...array,
						...(value === 'mute_unmute' ? (['user-muted', 'user-unmuted'] as const) : ([value] as const)),
					],
					[],
				),
			);
			const query: Mongo.Query<IMessage> = {
				rid: room._id,
				_hidden: { $ne: true },
				$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
				...(hideMessagesOfType.size && { t: { $nin: Array.from(hideMessagesOfType.values()) } }),
			};

			const options = {
				sort: {
					ts: 1,
				},
			};

			return Messages.find(query, options).fetch();
		}, [hideSystemMessages, room._id, room.sysMes]),
	);

	const [portals, blazePortals] = useBlazePortals();
	const messageRef = useLegacyMessageRef(blazePortals);

	return (
		<>
			{portals}
			{messagesHistory.map((message, index) => (
				<li key={message._id} ref={messageRef(message, index)} />
			))}
		</>
	);
};

export default memo(LegacyMessageTemplateList);
