import type { ReactNode, ReactElement } from 'react';
import React from 'react';

import * as ActionManager from '../../app/ui-message/client/ActionManager';
import { ActionManagerContext } from '../contexts/ActionManagerContext';
import { useAppActionButtons } from '../hooks/useAppActionButtons';
import { useAppSlashCommands } from '../hooks/useAppSlashCommands';
import { useAppUiKitInteraction } from '../hooks/useAppUiKitInteraction';

type ActionManagerProviderProps = {
	children?: ReactNode;
};

const ActionManagerProvider = ({ children }: ActionManagerProviderProps): ReactElement => {
	useAppActionButtons();
	useAppSlashCommands();
	useAppUiKitInteraction(ActionManager.handlePayloadUserInteraction);

	return <ActionManagerContext.Provider value={ActionManager}>{children}</ActionManagerContext.Provider>;
};

export default ActionManagerProvider;
