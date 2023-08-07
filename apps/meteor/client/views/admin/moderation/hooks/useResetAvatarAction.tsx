import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useResetAvatarAction = (userId: string) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const resetAvatar = useEndpoint('POST', '/v1/users.resetAvatar');

	const handleResetAvatar = useMutation({
		mutationFn: resetAvatar,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Avatar_reset_success') });
		},
	});

	const onResetAvatar = async () => {
		setModal();
		handleResetAvatar.mutateAsync({ userId });
		queryClient.invalidateQueries({ queryKey: ['moderation.reports'] });
	};

	const confirmResetAvatar = (): void => {
		setModal(
			<GenericModal
				title={t('Moderation_Reset_user_avatar')}
				confirmText={t('Reset')}
				variant='danger'
				onConfirm={() => onResetAvatar()}
				onCancel={() => setModal()}
			>
				{t('Moderation_Are_you_sure_you_want_to_reset_the_avatar')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Moderation_Reset_user_avatar'), icon: 'reload' },
		action: () => confirmResetAvatar(),
	};
};

export default useResetAvatarAction;
