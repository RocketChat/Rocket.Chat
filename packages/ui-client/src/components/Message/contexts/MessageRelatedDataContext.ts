import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useState } from 'react';
import { createContext, useContext } from 'react';

export type MessageQueryResult<TData> = { data: TData | undefined; isLoading: boolean; isError: boolean };

export type MessageConversation = { room: IRoom | undefined; subscription: ISubscription | undefined };

/**
 * Data a message shows about other things: its author's roles, the message it replies to, its room. Each is a hook, so the
 * provider decides how it is fetched and cached.
 */
export type MessageRelatedDataContextValue = {
	useUserRoles: (uid: IUser['_id'], rid: IRoom['_id'], options: { enabled: boolean }) => { workspaceRoles: string[]; roomRoles: string[] };
	useParentMessage: (tmid: IMessage['_id']) => MessageQueryResult<IMessage>;
	useMessageById: (messageId: IMessage['_id']) => MessageQueryResult<IMessage>;
	useConversation: (message: IMessage, options: { enabled: boolean }) => MessageQueryResult<MessageConversation>;
	/** Whether a collapsible part of a message is collapsed, remembered across mounts by `key`. */
	useCollapsedState: (key: string, initiallyCollapsed: boolean) => [isCollapsed: boolean, toggle: () => void];
};

const noRoles = { workspaceRoles: [], roomRoles: [] };
const nothing = { data: undefined, isLoading: false, isError: false };

const useLocalCollapsedState = (_key: string, initiallyCollapsed: boolean): [boolean, () => void] => {
	const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
	return [isCollapsed, () => setIsCollapsed((current) => !current)];
};

export const messageRelatedDataDefaultValue: MessageRelatedDataContextValue = {
	useUserRoles: () => noRoles,
	useParentMessage: () => nothing,
	useMessageById: () => nothing,
	useConversation: () => nothing,
	useCollapsedState: useLocalCollapsedState,
};

export const MessageRelatedDataContext = createContext<MessageRelatedDataContextValue>(messageRelatedDataDefaultValue);

export const useMessageRelatedData = () => useContext(MessageRelatedDataContext);
