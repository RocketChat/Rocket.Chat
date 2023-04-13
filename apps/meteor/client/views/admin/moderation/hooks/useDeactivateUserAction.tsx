import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useDeactivateUserAction = (userId: string, onChange: () => void, onReload: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const deactiveUser = useEndpoint('POST', '/v1/users.setActiveStatus');
	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteMessageHistory');

	const handleDeactivateUser = useMutation({
		mutationFn: deactiveUser,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('User_has_been_deactivated') });
		},
	});

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessages,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Deleted') });
		},
	});

	const onDeactivateUser = async () => {
		setModal();
		await handleDeleteMessages.mutateAsync({ userId });
		await handleDeactivateUser.mutateAsync({ userId, activeStatus: false });
		onChange();
		onReload();
	};

	const confirmDeactivateUser = (): void => {
		setModal(
			<GenericModal variant='danger' onConfirm={() => onDeactivateUser()} onCancel={() => setModal()}>
				{t('Moderation_Are_you_sure_you_want_to_deactivate_this_user')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Moderation_Deactivate_User'), icon: 'ban' },
		action: () => confirmDeactivateUser(),
	};
};

export default useDeactivateUserAction;
