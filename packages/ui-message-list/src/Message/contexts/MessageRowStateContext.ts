import { createContext, useContext } from 'react';

export type MessageRowStateContextValue = {
	isHighlighted: (messageId: string) => boolean;
};

export const MessageRowStateContext = createContext<MessageRowStateContextValue>({
	isHighlighted: () => false,
});

/** Whether the list draws attention to a message, as after a jump to it. */
export const useIsMessageHighlighted = (messageId: string) => useContext(MessageRowStateContext).isHighlighted(messageId);
