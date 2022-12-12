import { isThreadMainMessage } from '@rocket.chat/core-typings';
import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { useRoom } from '../../../contexts/RoomContext';
import { useGetMessageByID } from './useGetMessageByID';

export const useThreadMainMessageQuery = (tmid: IMessage['_id']): UseQueryResult<IThreadMainMessage, Error> => {
	const room = useRoom();

	const getMessage = useGetMessageByID();

	return useQuery(['rooms', room._id, 'threads', tmid, 'main-message'] as const, async () => {
		const mainMessage = await getMessage(tmid);

		if (!mainMessage && !isThreadMainMessage(mainMessage)) {
			throw new Error('Invalid main message');
		}

		return mainMessage;
	});
};
