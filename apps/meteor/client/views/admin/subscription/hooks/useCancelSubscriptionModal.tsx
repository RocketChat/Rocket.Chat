import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { useLicenseName } from '../../../../hooks/useLicense';
import { CancelSubscriptionModal } from '../components/CancelSubscriptionModal';
import { useRemoveLicense } from './useRemoveLicense';

export const useCancelSubscriptionModal = () => {
	const { data: planName = '' } = useLicenseName();
	const removeLicense = useRemoveLicense();
	const setModal = useSetModal();

	const open = useCallback(() => {
		const closeModal = () => setModal(null);

		const handleConfirm = () => {
			removeLicense.mutateAsync();
			closeModal();
		};

		setModal(<CancelSubscriptionModal planName={planName} onConfirm={handleConfirm} onCancel={closeModal} />);
	}, [removeLicense, planName, setModal]);

	return {
		open,
		isLoading: removeLicense.isLoading,
	};
};
