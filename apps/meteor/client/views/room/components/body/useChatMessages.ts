import { IRoom } from '@rocket.chat/core-typings';
import { RefObject, useEffect, useMemo } from 'react';

import { ChatMessages, chatMessages } from '../../../../../app/ui';

export const useChatMessages = (rid: IRoom['_id'], wrapperRef: RefObject<HTMLElement | null>): ChatMessages => {
	const chatMessagesInstance = useMemo(() => {
		const instance = chatMessages[rid] ?? new ChatMessages();
		chatMessages[rid] = instance;
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
