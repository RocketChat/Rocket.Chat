import { IRoom } from '@rocket.chat/core-typings';
import { RefObject, useEffect, useMemo } from 'react';

import { ChatMessages } from '../../../../../app/ui/client';

export const useChatMessages = (rid: IRoom['_id'], wrapperRef: RefObject<HTMLElement | null>): ChatMessages => {
	const chatMessagesInstance = useMemo(() => {
		const instance = ChatMessages.get({ rid }) ?? new ChatMessages({ rid });
		ChatMessages.set({ rid }, instance);
		return instance;
	}, [rid]);

	useEffect(() => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

		chatMessagesInstance.initializeWrapper(wrapper);
		return (): void => {
			chatMessagesInstance.onDestroyed?.(rid);
		};
	}, [chatMessagesInstance, rid, wrapperRef]);

	return chatMessagesInstance;
};
