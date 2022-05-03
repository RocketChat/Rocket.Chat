import { createContext, useContext, MouseEvent } from 'react';

import { ChannelMention } from '../definitions/ChannelMention';
import { UserMention } from '../definitions/UserMention';

type MessageBodyContextType = {
	mentions?: UserMention[];
	channels?: ChannelMention[];
	isThreadPreview?: boolean;
	onUserMentionClick?: (username: string) => (e: MouseEvent<HTMLDivElement>) => void;
	onChannelMentionClick?: (id: string) => (e: MouseEvent<HTMLDivElement>) => void;
};

export const MessageBodyContext = createContext<MessageBodyContextType>({
	mentions: [],
	channels: [],
});

export const useMessageBodyContext = (): MessageBodyContextType => useContext(MessageBodyContext);

export const useMessageBodyIsThreadPreview = (): MessageBodyContextType['isThreadPreview'] =>
	useContext(MessageBodyContext).isThreadPreview;

export const useMessageBodyUserMentions = (): UserMention[] => {
	const { mentions = [] } = useMessageBodyContext();
	return mentions;
};

export const useMessageBodyChannelMentions = (): ChannelMention[] => {
	const { channels = [] } = useMessageBodyContext();
	return channels;
};

export const useMessageBodyMentionClick = (): ((username: string) => (e: MouseEvent<HTMLDivElement>) => void) => {
	const { onUserMentionClick } = useMessageBodyContext();
	if (!onUserMentionClick) {
		console.warn('onUserMentionClick is not defined');
		return (username: string) => (): void => {
			console.log(`onUserMentionClickDefault: ${username}`);
		};
	}
	return onUserMentionClick;
};

export const useMessageBodyChannelMentionClick = (): ((id: string) => (e: MouseEvent<HTMLDivElement>) => void) => {
	const { onChannelMentionClick } = useMessageBodyContext();
	if (!onChannelMentionClick) {
		console.warn('onChannelMentionClick is not defined');
		return (username: string) => (): void => {
			console.log(`onChannelMentionClickDefault: ${username}`);
		};
	}
	return onChannelMentionClick;
};
