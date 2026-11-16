import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { MessageActionConfig, MessageActionContext } from './MessageAction';

export type MessageToolbarScope = {
	room: IRoom;
	subscription: ISubscription | undefined;
	context: MessageActionContext;
};

export type MessageToolbarContextValue = {
	/** The actions of the toolbar menu, built in and from apps, already gated by permissions and settings; the menu applies the place and the layout. */
	useMenuActions: (message: IMessage, scope: MessageToolbarScope) => MessageActionConfig[];
	/** The actions of the AI menu. */
	useAiActions: (message: IMessage, scope: MessageToolbarScope) => MessageActionConfig[];
	/**
	 * Emoji names offered as one-click reactions; the toolbar shows all of them. `undefined` where the place offers no
	 * reactions at all, so the toolbar shows neither these nor the button that adds one.
	 */
	useQuickReactions: () => string[] | undefined;
	/** Returns what to call when a quick reaction is used, so that the app can count it toward the emoji used most. */
	useCountQuickReaction: () => (emoji: string) => void;
};

const none = (): never[] => [];

const noop = () => undefined;

export const messageToolbarDefaultValue: MessageToolbarContextValue = {
	useMenuActions: none,
	useAiActions: none,
	useQuickReactions: none,
	useCountQuickReaction: () => noop,
};

export const MessageToolbarContext = createContext<MessageToolbarContextValue>(messageToolbarDefaultValue);

export const useMessageToolbar = () => useContext(MessageToolbarContext);
