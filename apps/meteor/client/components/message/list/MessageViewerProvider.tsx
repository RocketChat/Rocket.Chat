import { useSetting, useUserCard, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useContext, useMemo } from 'react';

import { MessageListContext } from './MessageListContext';
import type { MessageListViewer } from './messageListContract';

/** The viewer every message in a list is rendered for */
export const useMessageListViewerValue = (): MessageListViewer => {
	const uid = useUserId();
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	return useMemo(() => ({ uid: uid ?? undefined, useRealName, displayAvatars }), [uid, useRealName, displayAvatars]);
};

type MessageViewerProviderProps = {
	children: ReactNode;
};

/** Supplies the viewer and user card to messages shown outside a room's message list (audit, contact history, thread list) */
export const MessageViewerProvider = ({ children }: MessageViewerProviderProps) => {
	const list = useContext(MessageListContext);
	const viewer = useMessageListViewerValue();
	const { openUserCard, triggerProps } = useUserCard();

	const value = useMemo(() => ({ ...list, viewer, userCard: { openUserCard, triggerProps } }), [list, viewer, openUserCard, triggerProps]);

	return <MessageListContext.Provider value={value}>{children}</MessageListContext.Provider>;
};
