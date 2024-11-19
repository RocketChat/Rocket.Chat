import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import IncompatibleModal from '../modals/IncompatibleModal';

export const useOpenIncompatibleModal = () => {
	const setModal = useSetModal();

	return useCallback(
		async (app, actionName, cancelAction) => {
			setModal(
				<IncompatibleModal
					app={app}
					action={actionName}
					onClose={() => {
						setModal(null);
						cancelAction();
					}}
				/>,
			);
		},
		[setModal],
	);
};
