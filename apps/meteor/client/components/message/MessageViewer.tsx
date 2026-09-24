import { useSetting, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

/** What every rendered message needs to know about the person looking at it */
export type MessageViewer = {
	uid: ReturnType<typeof useUserId>;
	useRealName: boolean;
	displayAvatars: boolean | undefined;
};

const MessageViewerContext = createContext<MessageViewer | undefined>(undefined);

export const useOptionalMessageViewer = (): MessageViewer | undefined => useContext(MessageViewerContext);

export const useMessageViewer = (): MessageViewer => {
	const viewer = useContext(MessageViewerContext);
	if (!viewer) {
		throw new Error('useMessageViewer must be used under a MessageViewerProvider');
	}
	return viewer;
};

type MessageViewerProviderProps = {
	children: ReactNode;
};

/** Reads the viewer once, so a list of messages does not ask for it per message */
export const MessageViewerProvider = ({ children }: MessageViewerProviderProps) => {
	const uid = useUserId();
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	const viewer = useMemo(() => ({ uid, useRealName, displayAvatars }), [uid, useRealName, displayAvatars]);

	return <MessageViewerContext.Provider value={viewer}>{children}</MessageViewerContext.Provider>;
};
