import { createContext } from 'react';
import { EventHandlerOf } from '@rocket.chat/emitter';

import { actions, listen, QuickActionsActionConfig, QuickActionsAction, Events } from '.';
import './defaultActions';


export type QuickActionsEventHandler = (handler: EventHandlerOf<Events, 'change'>) => Function;

export type ChannelContextValue = {
	actions: Map<QuickActionsActionConfig['id'], QuickActionsAction>;
	listen: QuickActionsEventHandler;
}

export const QuickActionsContext = createContext<ChannelContextValue>({
	actions,
	listen,
});
