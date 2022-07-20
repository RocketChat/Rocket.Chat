import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React from 'react';

import ConfirmOwnerChangeWarningModal from '../../../../components/ConfirmOwnerChangeWarningModal';

export const confirmOwnerChanges =
	(action, modalProps = {}, onChange) =>
	async (): Promise<void> => {
		const setModal = useSetModal();
		const dispatchToastMessage = useToastMessageDispatch();

		try {
			return await action();
		} catch (error) {
			if (error.xhr?.responseJSON?.errorType === 'user-last-owner') {
				const { shouldChangeOwner, shouldBeRemoved } = error.xhr.responseJSON.details;

				const handleConfirm = async (): Promise<void> => {
					await action(true);
					setModal();
				};

				const handleCancel = (): void => {
					setModal();
					onChange();
				};

				return setModal(
					<ConfirmOwnerChangeWarningModal
						{...modalProps}
						shouldChangeOwner={shouldChangeOwner}
						shouldBeRemoved={shouldBeRemoved}
						onConfirm={handleConfirm}
						onCancel={handleCancel}
					/>,
				);
			}
			dispatchToastMessage({ type: 'error', message: error });
		}
	};
