import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React from 'react';

import ConfirmOwnerChangeWarningModal from '../../../../components/ConfirmOwnerChangeModal';

export const useConfirmOwnerChanges = (): ((
	action: (confirm?: boolean) => Promise<void>,
	modalProps: Pick<ComponentProps<typeof ConfirmOwnerChangeWarningModal>, 'contentTitle' | 'confirmText'>,
	onChange: () => void,
) => Promise<void>) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	return async (action, modalProps, onChange): Promise<void> => {
		try {
			return await action();
		} catch (error: any) {
			if (error.errorType === 'user-last-owner') {
				const { shouldChangeOwner, shouldBeRemoved } = error.details;

				const handleConfirm = async (): Promise<void> => {
					await action(true);
					setModal();
					onChange();
				};

				return setModal(
					<ConfirmOwnerChangeWarningModal
						{...modalProps}
						shouldChangeOwner={shouldChangeOwner}
						shouldBeRemoved={shouldBeRemoved}
						onConfirm={handleConfirm}
						onCancel={(): void => setModal()}
					/>,
				);
			}
			dispatchToastMessage({ type: 'error', message: error });
		}
	};
};
