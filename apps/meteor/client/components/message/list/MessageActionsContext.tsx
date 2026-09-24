import { createContext, useContext } from 'react';

import type { MessageActions, MessageActionsPolicy } from './messageListContract';
import { denyingMessageActionsPolicy, inertMessageActions } from './messageListContract';

export type MessageActionsContextValue = {
	policy: MessageActionsPolicy;
	actions: MessageActions;
};

export const MessageActionsContext = createContext<MessageActionsContextValue>({
	policy: denyingMessageActionsPolicy,
	actions: inertMessageActions,
});
MessageActionsContext.displayName = 'MessageActions';

export const useMessageActionsPolicy = (): MessageActionsPolicy => useContext(MessageActionsContext).policy;

export const useMessageActions = (): MessageActions => useContext(MessageActionsContext).actions;
