import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useDismissUserAction = (userId: string, onChange: () => void, onReload: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const dismissUser = useEndpoint('POST', '/v1/moderation.markChecked');

	const handleDismissUser = useMutation({
		mutationFn: dismissUser,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Reports_dismissed') });
		},
	});

	const onDismissUser = async () => {
		await handleDismissUser.mutateAsync({ userId });
		onChange();
		onReload();
		setModal();
	};

	const confirmDismissUser = (): void => {
		setModal(
			<GenericModal title={'Dismiss and Delete'} variant='danger' onConfirm={() => onDismissUser()} onCancel={() => setModal()}>
				Are you sure you want to dismiss and delete all reports for this user's messages? This action cannot be undone.
			</GenericModal>,
		);
	};

	return {
		label: { label: 'Dismiss Reports', icon: 'circle-check' },
		action: () => confirmDismissUser(),
	};
};

export default useDismissUserAction;
