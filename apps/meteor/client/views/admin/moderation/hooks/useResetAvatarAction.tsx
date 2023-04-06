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
			dispatchToastMessage({ type: 'success', message: t('Avatar_reset_successfully') });
		},
	});

	const onResetAvatar = async () => {
		setModal();
		handleResetAvatar.mutateAsync({ userId });
		onChange();
		onReload();
	};

	const confirmResetAvatar = (): void => {
		setModal(
			<GenericModal confirmText={t('Reset')} variant='danger' onConfirm={() => onResetAvatar()} onCancel={() => setModal()}>
				{t('Are_you_sure_you_want_to_reset_the_avatar')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Reset_user_avatar'), icon: 'reload' },
		action: () => confirmResetAvatar(),
	};
};

export default useResetAvatarAction;
