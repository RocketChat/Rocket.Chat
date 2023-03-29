import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useResetAvatarAction = (userId: string, onChange: () => void, onReload: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const resetAvatar = useEndpoint('POST', '/v1/users.resetAvatar');

	const handleResetAvatar = useMutation({
		mutationFn: resetAvatar,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Reset') });
		},
	});

	const onResetAvatar = async () => {
		setModal();
		await handleResetAvatar.mutateAsync({ userId });
		onChange();
		onReload();
	};

	const confirmResetAvatar = (): void => {
		setModal(
			<GenericModal confirmText={t('Reset')} variant='danger' onConfirm={() => onResetAvatar()} onCancel={() => setModal()}>
				This action will reset this user's avatar. Are you sure you want to continue?
			</GenericModal>,
		);
	};

	return {
		label: { label: 'Reset Avatar', icon: 'reload' },
		action: () => confirmResetAvatar(),
	};
};

export default useResetAvatarAction;
