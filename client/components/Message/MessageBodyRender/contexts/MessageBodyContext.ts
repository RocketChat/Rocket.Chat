import { createContext, useContext, MouseEvent } from 'react';

import { UserMention } from '../definitions/UserMention';

type MessageBodyContextType = {
	mentions?: UserMention[];
	onMentionClick?: (username: string) => (e: MouseEvent<HTMLDivElement>) => void;
};

export const MessageBodyContext = createContext<MessageBodyContextType>({
	mentions: [],
});

export const useMessageBodyContext = (): MessageBodyContextType => useContext(MessageBodyContext);

export const useMessageBodyMentions = (): UserMention[] => {
	const { mentions = [] } = useMessageBodyContext();
	return mentions;
};

export const useMessageBodyMentionClick = (): ((
	username: string,
) => (e: MouseEvent<HTMLDivElement>) => void) => {
	const { onMentionClick } = useMessageBodyContext();
	if (!onMentionClick) {
		console.warn('onMentionClick is not defined');
		return (username: string) => (): void => {
			console.log(`onMentionClickDefault: ${username}`);
		};
	}
	return onMentionClick;
};
