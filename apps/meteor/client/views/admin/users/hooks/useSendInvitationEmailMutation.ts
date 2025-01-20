import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type UseSendInvitationEmailMutationVariables = {
	emails: string[];
};

export const useSendInvitationEmailMutation = (): UseMutationResult<
	{ success: boolean },
	Error,
	UseSendInvitationEmailMutationVariables
> => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const sendInvites = useEndpoint('POST', '/v1/sendInvitationEmail');

	return useMutation({
		mutationFn: async ({ emails }) => {
			const result = await sendInvites({ emails });
			return result;
		},

		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Sending_Invitations') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});
};
