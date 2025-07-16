import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { AutoupdateToastMessage } from '../components/AutoupdateToastMessage';

export const useAutoupdate = () => {
	const toast = useToastMessageDispatch();
	const { t } = useTranslation();
	const isDevMode = process.env.NODE_ENV === 'development';

	useEffect(() => {
		const fn = () => {
			// To test this feature locally, comment the if statement below
			if (isDevMode) {
				window.location.reload();
				return;
			}
			toast({
				type: 'info',
				options: { isPersistent: true },
				message: <AutoupdateToastMessage />,
			});
		};

		document.addEventListener('client_changed', fn);

		return () => {
			document.removeEventListener('client_changed', fn);
		};
	}, [isDevMode, t, toast]);
};
