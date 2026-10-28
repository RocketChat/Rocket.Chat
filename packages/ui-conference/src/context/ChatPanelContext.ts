import { createContext, useContext } from 'react';

/**
 * What the chat panel's contents may do to the panel itself.
 *
 * The chat is built by the application and handed to this window as a node, but the panel it sits in is this
 * window's — so closing it is not the node's to decide, only to ask for. Handed down through context rather than
 * as props, because the node is already built by the time the window sees it.
 */
export type ChatPanelContextValue = {
	close: () => void;
};

export const ChatPanelContext = createContext<ChatPanelContextValue>({ close: () => undefined });

export const useConferenceChatPanel = (): ChatPanelContextValue => useContext(ChatPanelContext);
