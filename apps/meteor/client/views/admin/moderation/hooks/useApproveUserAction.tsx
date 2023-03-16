import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useApproveUserAction = (userId: string, onChange: () => void, onReload: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const approveUser = useEndpoint('POST', '/v1/moderation.markChecked');

	const handleApproveUser = useMutation({
		mutationFn: approveUser,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Approved') });
		},
	});

	const onApproveUser = () => {
		handleApproveUser.mutate({ userId });
		onChange();
		onReload();
		setModal();
	};

	const confirmApproveUser = (): void => {
		setModal(
			<GenericModal variant='danger' onConfirm={() => onApproveUser()} onCancel={() => setModal()}>
				By taking this action, all reports against this user will be approved and removed. Are you sure you want to proceed?{' '}
			</GenericModal>,
		);
	};

	return {
		label: { label: 'Approve User', icon: 'check' },
		action: () => confirmApproveUser(),
	};
};

export default useApproveUserAction;
