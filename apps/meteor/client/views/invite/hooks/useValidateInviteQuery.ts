import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useValidateInviteQuery = (token: string | undefined) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleValidateInviteToken = useEndpoint('POST', '/v1/validateInviteToken');

	return useQuery({
		queryKey: ['invite', token],
		queryFn: async () => {
			if (!token) {
				return false;
			}

			try {
				const { valid } = await handleValidateInviteToken({ token });
				return valid;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_validate_invite_token') });
				return false;
			}
		},
	});
};
