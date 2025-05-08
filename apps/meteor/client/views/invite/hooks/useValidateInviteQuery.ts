import { useEndpoint, useSessionDispatch, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useInviteTokenMutation } from './useInviteTokenMutation';

export const useValidateInviteQuery = (userId: string | null, token: string | undefined) => {
	const { t } = useTranslation();

	const registrationForm = useSetting('Accounts_RegistrationForm');

	const setLoginDefaultState = useSessionDispatch('loginDefaultState');
	const dispatchToastMessage = useToastMessageDispatch();
	const getInviteRoomMutation = useInviteTokenMutation();

	const handleValidateInviteToken = useEndpoint('POST', '/v1/validateInviteToken');

	const result = useQuery({
		queryKey: ['invite', token],
		queryFn: async () => {
			if (!token) {
				return false;
			}

			try {
				const { valid } = await handleValidateInviteToken({ token });

				// FIXME: decouple this state management from the query
				const onSuccess = async () => {
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

					return getInviteRoomMutation.mutate(token);
				};

				onSuccess();
				return valid;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_validate_invite_token') });
				return false;
			}
		},
	});

	return result;
};
