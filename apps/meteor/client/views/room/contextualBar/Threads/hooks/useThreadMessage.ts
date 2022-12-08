import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { Tracker } from 'meteor/tracker';
import { useEffect, useState, useCallback } from 'react';

import { ChatMessage } from '../../../../../../app/models/client';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';

export const useThreadMessage = (tmid: string): IMessage | undefined => {
	const [message, setMessage] = useState<IMessage | undefined>(() => Tracker.nonreactive(() => ChatMessage.findOne({ _id: tmid })));
	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');
	const getMessageParsed = useCallback<(params: { msgId: IMessage['_id'] }) => Promise<IMessage>>(
		async (params) => {
			const { message } = await getMessage(params);
			return mapMessageFromApi(message);
		},
		[getMessage],
	);

	useEffect(() => {
		const computation = Tracker.autorun(async (computation) => {
			const msg = ChatMessage.findOne({ _id: tmid }) || (await getMessageParsed({ msgId: tmid }));

			if (!msg || computation.stopped) {
				return;
			}

			setMessage((prevMsg) => {
				if (!prevMsg || prevMsg._id !== msg._id || prevMsg._updatedAt?.getTime() !== msg._updatedAt?.getTime()) {
					return msg;
				}

				return prevMsg;
			});
		});

		return (): void => {
			computation.stop();
		};
	}, [getMessageParsed, tmid]);

	return message;
};
