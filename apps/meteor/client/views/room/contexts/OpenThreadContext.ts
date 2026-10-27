import type { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type OpenThread = (tmid: IMessage['_id'], msg?: IMessage['_id']) => void;

/**
 * Where a thread opened from a message goes. Without a provider it opens in the room's contextual bar; a view that
 * shows the room's messages somewhere the contextual bar doesn't reach provides its own.
 */
export const OpenThreadContext = createContext<OpenThread | undefined>(undefined);

export const useOpenThreadOverride = () => useContext(OpenThreadContext);
