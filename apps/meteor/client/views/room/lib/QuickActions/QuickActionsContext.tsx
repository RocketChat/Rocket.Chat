import type { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, useContext } from 'react';

import type { QuickActionsActionConfig, QuickActionsAction, Events } from '.';
import { actions, listen } from '.';

import './defaultActions';

export type QuickActionsEventHandler = (handler: EventHandlerOf<Events, 'change'>) => unknown;

export type QuickActionsContextValue = {
	actions: Map<QuickActionsActionConfig['id'], QuickActionsAction>;
	listen: QuickActionsEventHandler;
};

export const QuickActionsContext = createContext<QuickActionsContextValue>({
	actions,
	listen,
});

export const useQuickActionsContext = (): QuickActionsContextValue => useContext(QuickActionsContext);
