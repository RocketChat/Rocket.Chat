import { useLogout, useEndpoint, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import type { MutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useResetE2EPasswordMutation = ({ options }: { options?: MutationOptions } = {}) => {
	const { t } = useTranslation();

	const logout = useLogout();
	const userId = useUserId();
	const resetE2eKey = useEndpoint('POST', '/v1/users.resetE2EKey');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async () => {
			if (!userId) {
				throw new Error('No user id');
			}
			return resetE2eKey({ userId });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('E2EE_password_reset') });
			logout();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	});
};
