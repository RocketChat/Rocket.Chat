import { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, useContext } from 'react';

import { actions, listen, QuickActionsActionConfig, QuickActionsAction, Events } from '.';

import './defaultActions';

export type QuickActionsEventHandler = (handler: EventHandlerOf<Events, 'change'>) => Function;

export type QuickActionsContext = {
	actions: Map<QuickActionsActionConfig['id'], QuickActionsAction>;
	listen: QuickActionsEventHandler;
};

export const QuickActionsContext = createContext<QuickActionsContext>({
	actions,
	listen,
});

export const useQuickActionsContext = (): QuickActionsContext => useContext(QuickActionsContext);
