import type { App } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import IframeModal from '../IframeModal';
import { useAppsOrchestration } from './useAppsOrchestration';
import { handleAPIError } from '../helpers/handleAPIError';

export const useOpenIncompatibleModal = () => {
	const setModal = useSetModal();

	const appsOrchestrator = useAppsOrchestration();

	if (!appsOrchestrator) {
		throw new Error('Apps orchestrator is not available');
	}

	return useCallback(
		async (app: App, actionName: string, cancelAction: () => void) => {
			const handleCancel = () => {
				setModal(null);
				cancelAction();
			};

			const handleConfirm = () => {
				setModal(null);
				cancelAction();
			};

			try {
				const incompatibleData = await appsOrchestrator.buildIncompatibleExternalUrl(app.id, app.marketplaceVersion, actionName);
				setModal(<IframeModal url={incompatibleData.url} cancel={handleCancel} confirm={handleConfirm} />);
			} catch (e) {
				handleAPIError(e);
			}
		},
		[appsOrchestrator, setModal],
	);
};
