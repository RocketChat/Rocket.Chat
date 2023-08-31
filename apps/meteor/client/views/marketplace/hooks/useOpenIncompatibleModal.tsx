import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { AppClientOrchestratorInstance } from '../../../../ee/client/apps/orchestrator';
import IframeModal from '../IframeModal';
import { handleAPIError } from '../helpers/handleAPIError';

export const useOpenIncompatibleModal = () => {
	const setModal = useSetModal();

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
				const incompatibleData = await AppClientOrchestratorInstance.buildIncompatibleExternalUrl(
					app.id,
					app.marketplaceVersion,
					actionName,
				);
				setModal(<IframeModal url={incompatibleData.url} cancel={handleCancel} confirm={handleConfirm} />);
			} catch (e) {
				handleAPIError(e);
			}
		},
		[setModal],
	);
};
