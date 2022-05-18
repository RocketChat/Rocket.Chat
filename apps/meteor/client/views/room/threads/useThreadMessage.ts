import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { Tracker } from 'meteor/tracker';
import { useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from 'react-query';

import { ChatMessage } from '../../../../app/models/client';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';

export const useThreadMessage = (tmid: string): UseQueryResult<IMessage, Error> => {
	const getMessage = useEndpoint('GET', 'chat.getMessage');

	const query = useQuery<IMessage, Error>(
		['thread', tmid, 'message'],
		async (): Promise<IMessage> => {
			const { message } = await getMessage({ msgId: tmid });
			return mapMessageFromApi(message);
		},
		{
			initialData: ChatMessage.findOne({ _id: tmid }) as IMessage | undefined,
		},
	);

	const queryClient = useQueryClient();

	useEffect(() => {
		const computation = Tracker.autorun(async (computation) => {
			const msg: IMessage | undefined = ChatMessage.findOne({ _id: tmid });

			if (!msg || computation.stopped) {
				return;
			}

			queryClient.setQueryData(['thread', tmid, 'message'], msg);
		});

		return (): void => {
			computation.stop();
		};
	}, [queryClient, tmid]);

	return query;
};
