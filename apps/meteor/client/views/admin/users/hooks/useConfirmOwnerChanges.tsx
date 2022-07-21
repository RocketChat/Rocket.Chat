import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { ComponentProps } from 'react';

import ConfirmOwnerChangeWarningModal from '../../../../components/ConfirmOwnerChangeModal';

export const useConfirmOwnerChanges = (): ((
	action: (confirm?: boolean) => void,
	modalProps: Pick<ComponentProps<typeof ConfirmOwnerChangeWarningModal>, 'contentTitle' | 'confirmText'>,
	onChange: () => void,
) => Promise<void>) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	return async (action, modalProps, onChange): Promise<void> => {
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
};
