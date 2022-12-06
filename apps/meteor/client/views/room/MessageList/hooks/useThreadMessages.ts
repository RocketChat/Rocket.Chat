import type { IThreadMessage } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Messages } from '../../../../../app/models/client';
import { queryClient } from '../../../../lib/queryClient';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';

const fetchThreadMessages = async (tmid: IThreadMessage['tmid']): Promise<IThreadMessage[]> => {
	const messages = (await callWithErrorHandling('getThreadMessages', { tmid })) as IThreadMessage[];
	return messages?.sort((a: IThreadMessage, b: IThreadMessage) => Number(a.ts) - Number(b.ts));
};

// Edit message is not working (fails to read message dataset)
// Delete message is not working (fails to read message dataset)
// Issues with sequential messages

export const useThreadMessages = ({ tmid }: { tmid: IThreadMessage['tmid'] }): IThreadMessage[] => {
	useEffect(() => {
		const threadsObserve = Messages.find(
			{ $or: [{ tmid }, { _id: tmid }], _hidden: { $ne: true } },
			{
				fields: {
					collapsed: 0,
					threadMsg: 0,
					repliesCount: 0,
				},
			},
		).observe({
			added: (message: IThreadMessage) => {
				console.log('added');
				queryClient.setQueryData<IThreadMessage[]>(['threadMessages', tmid], (currentData) => [...(currentData || []), message]);
			},
			changed: (message: IThreadMessage) => {
				queryClient.setQueryData<IThreadMessage[]>(['threadMessages', tmid], (currentData) => {
					// console.log(message, currentData);
					if (!currentData) {
						return [];
					}
					const index = currentData.findIndex((currentMessage) => currentMessage._id === message._id);
					if (index === -1) {
						return currentData;
					}
					return [...currentData.slice(0, index), message, ...currentData.slice(index + 1)];
				});
			},
			removed: ({ _id }: IThreadMessage) => {
				console.log('removed');
				queryClient.setQueryData<IThreadMessage[]>(['threadMessages', tmid], (currentData) => {
					if (!currentData) {
						return [];
					}
					const index = currentData.findIndex((currentMessage) => currentMessage._id === _id);
					if (index === -1) {
						return currentData;
					}
					return [...currentData.slice(0, index), ...currentData.slice(index + 1)];
				});
			},
		});

		return (): void => threadsObserve.stop();
	}, [tmid]);

	const { data, isSuccess } = useQuery(['threadMessages', tmid], () => fetchThreadMessages(tmid));

	if (isSuccess && data) {
		return data;
	}

	return [];
};
