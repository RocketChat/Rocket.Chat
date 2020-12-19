import { useCallback } from 'react';

import { useEndpoint } from '../../../../../contexts/ServerContext';
import { IMessage } from '../../../../../../definition/IMessage';
import { IRoom } from '../../../../../../definition/IRoom';
import { Sort } from '../../../../../lib/minimongo';

type RawMessage = Omit<IMessage, '_updatedAt' | 'ts'> & {
	_updatedAt: string;
	ts: string;
};

type GetStarredMessagesParams = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	sort?: Sort;
};

type GetStarredMessagesReturn = Promise<{
	messages: RawMessage[];
}>;

type GetStarredMessagesType = (params: GetStarredMessagesParams) => GetStarredMessagesReturn;

const mapRawMessage = (message: RawMessage): IMessage => ({
	...message,
	_updatedAt: new Date(message._updatedAt),
	ts: new Date(message.ts),
});

export const useGetStarredMessages = (): ((params: GetStarredMessagesParams) => Promise<IMessage[]>) => {
	const getStarredMessages: GetStarredMessagesType = useEndpoint('GET', 'chat.getStarredMessages');

	return useCallback<(params: GetStarredMessagesParams) => Promise<IMessage[]>>(async (params) => {
		const result = await getStarredMessages(params);
		return result.messages.map(mapRawMessage);
	}, [getStarredMessages]);
};
