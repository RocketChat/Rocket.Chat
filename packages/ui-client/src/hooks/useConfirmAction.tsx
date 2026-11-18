import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../components/Modal/GenericModal';

type ConfirmActionModalProps = {
	confirmText: ReactNode;
	onConfirm: () => Promise<void>;
	onCancel: () => void;
};

/** Runs the confirmation at most once and stays open until it settles, since an action under way cannot be called back. */
const ConfirmActionModal = ({ confirmText, onConfirm, onCancel }: ConfirmActionModalProps) => {
	const [pending, setPending] = useState(false);

	const handleConfirm = async () => {
		setPending(true);
		await onConfirm();
	};

	const handleCancel = () => {
		if (!pending) {
			onCancel();
		}
	};

	return (
		<GenericModal
			variant='danger'
			onConfirm={handleConfirm}
			onCancel={handleCancel}
			confirmText={confirmText}
			confirmLoading={pending}
			cancelDisabled={pending}
		/>
	);
};

type UseConfirmActionOptions = {
	successMessage: string;
	confirmText?: ReactNode;
};

/** Asks the user to confirm a destructive action, then runs it and reports the outcome as a toast. */
export const useConfirmAction = <TArgs extends unknown[]>(
	action: (...args: TArgs) => Promise<unknown>,
	{ successMessage, confirmText }: UseConfirmActionOptions,
): ((...args: TArgs) => void) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	return useStableCallback((...args: TArgs) => {
		const handleConfirm = async () => {
			try {
				await action(...args);
				dispatchToastMessage({ type: 'success', message: successMessage });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(<ConfirmActionModal confirmText={confirmText ?? t('Delete')} onConfirm={handleConfirm} onCancel={() => setModal(null)} />);
	});
};
