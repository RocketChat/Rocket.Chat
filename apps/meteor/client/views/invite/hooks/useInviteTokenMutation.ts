import { useEndpoint, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useInviteTokenMutation = () => {
	const { t } = useTranslation();
	const router = useRouter();

	const dispatchToastMessage = useToastMessageDispatch();

	const getInviteRoom = useEndpoint('POST', '/v1/useInviteToken');

	return useMutation({
		mutationFn: (token: string) => getInviteRoom({ token }),
		onSuccess: (result) => {
			if (!result.room.name) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
				router.navigate('/home');
				return;
			}

			if (result.room.t === 'p') {
				router.navigate(`/group/${result.room.name}`);
				return;
			}

			router.navigate(`/channel/${result.room.name}`);
		},
		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
			router.navigate('/home');
		},
	});
};
