import type { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

/** The message the composer is editing, if any. */
export const MessageEditingContext = createContext<IMessage['_id'] | undefined>(undefined);

export const useIsMessageBeingEdited = (messageId: IMessage['_id']) => useContext(MessageEditingContext) === messageId;
