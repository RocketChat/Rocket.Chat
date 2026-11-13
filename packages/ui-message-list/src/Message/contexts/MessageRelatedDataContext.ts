import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useState, createContext, useContext } from 'react';

export type MessageQueryResult<TData> = { data: TData | undefined; isLoading: boolean; isError: boolean };

export type MessageConversation = { room: IRoom | undefined; subscription: ISubscription | undefined };

export type MessageByIdOptions = {
	enabled: boolean;
	/** Changes when what the caller reads from the message changed, so a copy fetched before is not reused. */
	revision?: readonly unknown[];
};

/**
 * Data a message shows about other things: its author's roles, the message it replies to, its room. Each is a hook, so the
 * provider decides how it is fetched and cached.
 */
export type MessageRelatedDataContextValue = {
	/**
	 * The labels of an author's roles when the place already resolved them for the whole list, so a header does not look
	 * them up itself; `undefined` when it did not, and `useUserRoles` answers instead.
	 */
	usePlaceUserRoles: (uid: IUser['_id'], rid: IRoom['_id']) => { workspaceRoles: string[]; roomRoles: string[] } | undefined;
	useUserRoles: (uid: IUser['_id'], rid: IRoom['_id'], options: { enabled: boolean }) => { workspaceRoles: string[]; roomRoles: string[] };
	useParentMessage: (tmid: IMessage['_id']) => MessageQueryResult<IMessage>;
	useMessageById: (messageId: IMessage['_id'], options?: MessageByIdOptions) => MessageQueryResult<IMessage>;
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
	usePlaceUserRoles: () => undefined,
	useUserRoles: () => noRoles,
	useParentMessage: () => nothing,
	useMessageById: () => nothing,
	useConversation: () => nothing,
	useCollapsedState: useLocalCollapsedState,
};

export const MessageRelatedDataContext = createContext<MessageRelatedDataContextValue>(messageRelatedDataDefaultValue);

export const useMessageRelatedData = () => useContext(MessageRelatedDataContext);
