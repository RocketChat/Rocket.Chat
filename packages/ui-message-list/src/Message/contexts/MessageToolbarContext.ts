import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { MessageActionConfig, MessageActionContext } from './MessageAction';

export type MessageToolbarScope = {
	room: IRoom;
	subscription: ISubscription | undefined;
	context: MessageActionContext;
};

export type MessageToolbarContextValue = {
	/** The actions of the toolbar menu, built in and from apps, already filtered by permissions, settings and layout. */
	useMenuActions: (message: IMessage, scope: MessageToolbarScope) => MessageActionConfig[];
	/** The actions of the AI menu. */
	useAiActions: (message: IMessage, scope: MessageToolbarScope) => MessageActionConfig[];
	/** Emoji names offered as one-click reactions. */
	useQuickReactions: () => string[];
};

const none = (): never[] => [];

export const messageToolbarDefaultValue: MessageToolbarContextValue = {
	useMenuActions: none,
	useAiActions: none,
	useQuickReactions: none,
};

export const MessageToolbarContext = createContext<MessageToolbarContextValue>(messageToolbarDefaultValue);

export const useMessageToolbar = () => useContext(MessageToolbarContext);
