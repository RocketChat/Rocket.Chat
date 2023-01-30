import type { ReactNode, ReactElement } from 'react';
import React from 'react';

import * as ActionManager from '../../app/ui-message/client/ActionManager';
import { ActionManagerContext } from '../contexts/ActionManagerContext';

type ActionManagerProviderProps = {
	children?: ReactNode;
};

const ActionManagerProvider = ({ children }: ActionManagerProviderProps): ReactElement => {
	return <ActionManagerContext.Provider value={ActionManager}>{children}</ActionManagerContext.Provider>;
};

export default ActionManagerProvider;
