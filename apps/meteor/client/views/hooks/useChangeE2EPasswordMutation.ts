import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { e2e } from '../../lib/e2ee/rocketchat.e2e';

export const useChangeE2EPasswordMutation = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async (newPassword: string) => {
			await e2e.changePassword(newPassword);
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Encryption_key_saved_successfully') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
