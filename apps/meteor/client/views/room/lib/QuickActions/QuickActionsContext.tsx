import type { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, useContext } from 'react';

import type { QuickActionsActionConfig, Events } from '.';
import { actions, listen } from '.';

type QuickActionsEventHandler = (handler: EventHandlerOf<Events, 'change'>) => unknown;

type QuickActionsContextValue = {
	actions: Map<QuickActionsActionConfig['id'], QuickActionsActionConfig>;
	listen: QuickActionsEventHandler;
};

const QuickActionsContext = createContext<QuickActionsContextValue>({
	actions,
	listen,
});

export const useQuickActionsContext = (): QuickActionsContextValue => useContext(QuickActionsContext);
