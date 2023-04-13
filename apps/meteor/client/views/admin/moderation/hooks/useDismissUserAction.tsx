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
			dispatchToastMessage({ type: 'success', message: t('Moderation_Reports_dismissed') });
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
				{t('Moderation_Are_you_sure_dismiss_and_delete_reports')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Moderation_Dismiss_reports'), icon: 'circle-check' },
		action: () => confirmDismissUser(),
	};
};

export default useDismissUserAction;
