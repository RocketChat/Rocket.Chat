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
			<GenericModal title={'Dismiss and Delete'} variant='danger' onConfirm={() => onApproveUser()} onCancel={() => setModal()}>
				Are you sure you want to dismiss and delete all reports for this user's messages? This action cannot be undone.
			</GenericModal>,
		);
	};

	return {
		label: { label: 'Dismiss Reports', icon: 'circle-check' },
		action: () => confirmApproveUser(),
	};
};

export default useApproveUserAction;
