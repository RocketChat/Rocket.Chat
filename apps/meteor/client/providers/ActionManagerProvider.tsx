import { ActionManagerContext, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';

import { ActionManager } from '../../app/ui-message/client/ActionManager';
import { useAppActionButtons } from '../hooks/useAppActionButtons';
import { useAppSlashCommands } from '../hooks/useAppSlashCommands';
import { useAppUiKitInteraction } from '../hooks/useAppUiKitInteraction';
import { useTranslationsForApps } from '../hooks/useTranslationsForApps';
import { useInstance } from '../views/room/providers/hooks/useInstance';

type ActionManagerProviderProps = {
	children?: ReactNode;
};

const ActionManagerProvider = ({ children }: ActionManagerProviderProps): ReactElement => {
	const router = useRouter();
	const actionManager = useInstance(() => [new ActionManager(router)], [router]);
	useTranslationsForApps();
	useAppActionButtons();
	useAppSlashCommands();
	useAppUiKitInteraction(actionManager.handleServerInteraction.bind(actionManager));

	return <ActionManagerContext.Provider value={actionManager}>{children}</ActionManagerContext.Provider>;
};

export default ActionManagerProvider;
