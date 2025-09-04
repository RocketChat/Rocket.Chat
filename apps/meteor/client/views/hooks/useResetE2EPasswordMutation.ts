import { useLogout, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { MutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useResetE2EPasswordMutation = ({ options }: { options?: MutationOptions } = {}) => {
	const { t } = useTranslation();

	const logout = useLogout();
	const resetE2eKey = useMethod('e2e.resetOwnE2EKey');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async () => resetE2eKey(),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('User_e2e_key_was_reset') });
			logout();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	});
};
