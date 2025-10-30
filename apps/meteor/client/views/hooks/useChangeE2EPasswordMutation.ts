import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { changePassword } from '../../lib/e2ee';

export const useChangeE2EPasswordMutation = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: changePassword,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Encryption_key_saved_successfully') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
