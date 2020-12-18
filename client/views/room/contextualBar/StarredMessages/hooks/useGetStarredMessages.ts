import { useCallback } from 'react';

import { useEndpoint } from '../../../../../contexts/ServerContext';
import { IMessage } from '../../../../../../definition/IMessage';
import { IRoom } from '../../../../../../definition/IRoom';


type GetStarredMessagesParams = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	sort?: unknown;
};

type RawMessage = Omit<IMessage, '_updatedAt' | 'ts'> // we omit the fields of Date type...
& { _updatedAt: string; ts: string }; // and re-add them as strings

const mapRawMessage = (message: RawMessage): IMessage => ({
	...message,
	_updatedAt: new Date(message._updatedAt),
	ts: new Date(message.ts),
});

export const useGetStarredMessages = (): ((params: GetStarredMessagesParams) => Promise<IMessage[]>) => {
	const getStarredMessages = useEndpoint('GET', 'chat.getStarredMessages');

	return useCallback<(params: GetStarredMessagesParams) => Promise<IMessage[]>>(async (params) => {
		const result = await getStarredMessages(params);

		/*
			Messages coming from the REST API are just plain JSON objects i.e. all the dates are strings
			in the ISO 8601 format. We need to convert `_updatedAt` and `ts` types from string to Date.
		*/
		return result.messages.map(mapRawMessage);
	}, [getStarredMessages]);
};
