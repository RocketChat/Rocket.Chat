import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type useSendWelcomeEmailMutationProps = {
	email: string | undefined;
};

export const useSendWelcomeEmailMutation = (): UseMutationResult<null, Error, useSendWelcomeEmailMutationProps> => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const sendWelcomeEmail = useEndpoint('POST', '/v1/users.sendWelcomeEmail');

	return useMutation({
		mutationFn: async ({ email }) => {
			if (!email) {
				dispatchToastMessage({ type: 'error', message: t('Welcome_email_failed') });
				return null;
			}

			return sendWelcomeEmail({ email });
		},

		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Welcome_email_resent') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});
};
