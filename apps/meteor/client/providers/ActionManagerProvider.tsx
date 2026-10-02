import { ActionManagerContext, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { useAppActionButtons } from '../hooks/useAppActionButtons';
import { useAppSlashCommands } from '../hooks/useAppSlashCommands';
import { useAppUiKitInteraction } from '../hooks/useAppUiKitInteraction';
import { useTranslationsForApps } from '../hooks/useTranslationsForApps';
import { ActionManager } from '../lib/ActionManager';
import { useInstance } from '../views/room/providers/hooks/useInstance';

export type ActionManagerProviderProps = {
	children?: ReactNode;
};

const ActionManagerProvider = ({ children }: ActionManagerProviderProps) => {
	const router = useRouter();
	const actionManager = useInstance(() => [new ActionManager(router)], [router]);
	useTranslationsForApps();
	useAppActionButtons();
	useAppSlashCommands();
	useAppUiKitInteraction(actionManager.handleServerInteraction.bind(actionManager));

	return <ActionManagerContext.Provider value={actionManager}>{children}</ActionManagerContext.Provider>;
};

export default ActionManagerProvider;
