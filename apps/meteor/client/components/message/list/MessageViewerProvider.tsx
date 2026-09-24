import { useSetting, useUser, useUserCard, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { MessageViewerContext } from './MessageViewerContext';
import type { MessageViewerContextValue } from './MessageViewerContext';

/** The person every message in a list is rendered for, and the user card their rows open */
export const useMessageViewerValue = (): MessageViewerContextValue => {
	const user = useUser();
	const uid = user?._id;
	const username = user?.username;
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));
	const displayAvatars = useUserPreference<boolean>('displayAvatars');
	const { openUserCard, triggerProps } = useUserCard();

	return useMemo(
		() => ({ viewer: { uid, username, useRealName, displayAvatars }, userCard: { openUserCard, triggerProps } }),
		[uid, username, useRealName, displayAvatars, openUserCard, triggerProps],
	);
};

type MessageViewerProviderProps = {
	children: ReactNode;
};

/** Supplies the viewer and user card to the messages of a list, or of a screen that shows messages outside a room (audit, contact history, thread list) */
export const MessageViewerProvider = ({ children }: MessageViewerProviderProps) => (
	<MessageViewerContext.Provider value={useMessageViewerValue()}>{children}</MessageViewerContext.Provider>
);
