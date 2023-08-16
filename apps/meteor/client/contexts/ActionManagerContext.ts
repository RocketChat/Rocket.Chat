import { createContext } from 'react';

import type * as ActionManager from '../../app/ui-message/client/ActionManager';

type ActionManagerContextValue = typeof ActionManager;

export const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);
