import { useEndpoint, useSessionDispatch, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useInviteTokenMutation } from './useInviteTokenMutation';

export const useValidateInviteQuery = (userId: string | null, token: string | undefined) => {
	const t = useTranslation();

	const registrationForm = useSetting('Accounts_RegistrationForm');

	const setLoginDefaultState = useSessionDispatch('loginDefaultState');
	const dispatchToastMessage = useToastMessageDispatch();
	const getInviteRoomMutation = useInviteTokenMutation();

	const handleValidateInviteToken = useEndpoint('POST', '/v1/validateInviteToken');

	return useQuery(
		['invite', token],
		async () => {
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
		{
			onSuccess: async (valid) => {
				if (!token) {
					return;
				}

				if (registrationForm !== 'Disabled') {
					setLoginDefaultState('invite-register');
				} else {
					setLoginDefaultState('login');
				}

				if (!valid || !userId) {
					return;
				}

				return getInviteRoomMutation(token);
			},
		},
	);
};
