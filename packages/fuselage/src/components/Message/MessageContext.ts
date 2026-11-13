import { createContext, useContext } from 'react';

export type MessageContextValue = {
	sequential: boolean;
	pending: boolean;
};

/**
 * What a message hands its slotted parts, which cannot read it from the row's classes. Absent outside a `Message`.
 */
export const MessageContext = createContext<MessageContextValue | undefined>(undefined);

export const useMessageContext = () => useContext(MessageContext);

/**
 * Tells the parts of a message header that they sit in it, where a long name gives way before the timestamp.
 */
export const MessageHeaderContext = createContext(false);

export const useInMessageHeader = () => useContext(MessageHeaderContext);
