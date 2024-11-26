import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { useAppsOrchestrator } from './useAppsOrchestrator';
import IncompatibleModal from '../modals/IncompatibleModal';

export const useOpenIncompatibleModal = () => {
	const setModal = useSetModal();

	const appsOrchestrator = useAppsOrchestrator();

	return useCallback(
		async (app, actionName, cancelAction) => {
			setModal(
				<IncompatibleModal
					app={app}
					appsOrchestrator={appsOrchestrator}
					action={actionName}
					onClose={() => {
						setModal(null);
						cancelAction();
					}}
				/>,
			);
		},
		[appsOrchestrator, setModal],
	);
};
