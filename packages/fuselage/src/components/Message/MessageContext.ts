import { createContext } from 'react';

/** Tells the body of a message that the message is still being sent. */
export const MessagePendingContext = createContext(false);

/** Tells the parts of a message header that they sit in it, where a long name gives way before the timestamp does. */
export const MessageHeaderContext = createContext(false);
