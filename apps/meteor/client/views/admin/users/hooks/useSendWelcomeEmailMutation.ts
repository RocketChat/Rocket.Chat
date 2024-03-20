import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

type useSendWelcomeEmailMutationProps = {
	email: string;
};

export const useSendWelcomeEmailMutation = (): UseMutationResult<null, Error, useSendWelcomeEmailMutationProps> => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const sendWelcomeEmail = useEndpoint('POST', '/v1/users.sendWelcomeEmail');

	return useMutation(
		async ({ email }) => {
			const result = await sendWelcomeEmail({ email });
			return result;
		},
		{
			onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Welcome_email_resent') }),
			onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		},
	);
};
