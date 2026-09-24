import { createContext, useContext } from 'react';

import type { MessageActions, MessageActionsPolicy } from './messageListContract';
import { denyingMessageActionsPolicy, inertMessageActions } from './messageListContract';

export const MessageActionsPolicyContext = createContext<MessageActionsPolicy>(denyingMessageActionsPolicy);
MessageActionsPolicyContext.displayName = 'MessageActionsPolicy';

export const MessageActionsContext = createContext<MessageActions>(inertMessageActions);
MessageActionsContext.displayName = 'MessageActions';

export const useMessageActionsPolicy = (): MessageActionsPolicy => useContext(MessageActionsPolicyContext);

export const useMessageActions = (): MessageActions => useContext(MessageActionsContext);
