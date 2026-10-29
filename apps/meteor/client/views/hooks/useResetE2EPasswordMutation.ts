import { useLogout, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { MutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useResetE2EPasswordMutation = ({ options }: { options?: MutationOptions } = {}) => {
	const { t } = useTranslation();

	const logout = useLogout();
	const resetE2eKey = useEndpoint('POST', '/v1/users.resetE2EKey');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		// The local search index is not wiped here. The new key cannot open it, and the desktop app replaces it at the next
		// open, when the server has another public key for the user. This also covers a reset on another device.
		mutationFn: async () => resetE2eKey({}),
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
