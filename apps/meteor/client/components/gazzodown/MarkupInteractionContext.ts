import { IRoom, IUser } from '@rocket.chat/core-typings';
import { createContext, useContext, MouseEvent } from 'react';

type UserMention = Pick<IUser, '_id' | 'name' | 'username'>;
type ChannelMention = Pick<IRoom, '_id' | 'name'>;

type MarkupInteractionContextValue = {
	mentions?: UserMention[];
	channels?: ChannelMention[];
	onUserMentionClick?: (username: string) => (e: MouseEvent<HTMLDivElement>) => void;
	onChannelMentionClick?: (id: string) => (e: MouseEvent<HTMLDivElement>) => void;
};

export const MarkupInteractionContext = createContext<MarkupInteractionContextValue>({
	mentions: [],
	channels: [],
});

export const useMarkupInteractionContext = (): MarkupInteractionContextValue => useContext(MarkupInteractionContext);

export const useMessageBodyUserMentions = (): UserMention[] => {
	const { mentions = [] } = useMarkupInteractionContext();
	return mentions;
};

export const useMessageBodyChannelMentions = (): ChannelMention[] => {
	const { channels = [] } = useMarkupInteractionContext();
	return channels;
};

export const useMessageBodyMentionClick = (): ((username: string) => (e: MouseEvent<HTMLDivElement>) => void) => {
	const { onUserMentionClick } = useMarkupInteractionContext();
	if (!onUserMentionClick) {
		console.warn('onUserMentionClick is not defined');
		return (username: string) => (): void => {
			console.log(`onUserMentionClickDefault: ${username}`);
		};
	}
	return onUserMentionClick;
};

export const useMessageBodyChannelMentionClick = (): ((id: string) => (e: MouseEvent<HTMLDivElement>) => void) => {
	const { onChannelMentionClick } = useMarkupInteractionContext();
	if (!onChannelMentionClick) {
		console.warn('onChannelMentionClick is not defined');
		return (username: string) => (): void => {
			console.log(`onChannelMentionClickDefault: ${username}`);
		};
	}
	return onChannelMentionClick;
};
