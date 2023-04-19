import { createContext, useContext } from 'react';

import type * as ActionManager from '../../app/ui-message/client/ActionManager';

type ActionManagerContextValue = typeof ActionManager;

export const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);

export const useActionManager = (): typeof ActionManager | undefined => {
	return useContext(ActionManagerContext);
};
