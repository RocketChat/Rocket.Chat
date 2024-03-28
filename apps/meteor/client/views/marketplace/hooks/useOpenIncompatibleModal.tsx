import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import IframeModal from '../IframeModal';
import { handleAPIError } from '../helpers/handleAPIError';
import { useAppsOrchestration } from './useAppsOrchestration';

export const useOpenIncompatibleModal = () => {
	const setModal = useSetModal();

	const appsOrchestrator = useAppsOrchestration();

	if (!appsOrchestrator) {
		throw new Error('Apps orchestrator is not available');
	}

	return useCallback(
		async (app, actionName, cancelAction) => {
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
