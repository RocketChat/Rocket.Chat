import { IRoom } from '@rocket.chat/core-typings';
import { useEffect, useMemo } from 'react';

import { ChatMessages } from '../../../../../app/ui/client';

export const useChatMessages = (rid: IRoom['_id']): ChatMessages => {
	const chatMessagesInstance = useMemo(() => {
		const instance = ChatMessages.get({ rid }) ?? new ChatMessages({ rid });
		ChatMessages.set({ rid }, instance);
		return instance;
	}, [rid]);

	useEffect(
		() => (): void => {
			ChatMessages.delete({ rid });
		},
		[chatMessagesInstance, rid],
	);

	return chatMessagesInstance;
};
