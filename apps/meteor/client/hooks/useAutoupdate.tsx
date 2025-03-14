import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useAutoupdate = () => {
	const toast = useToastMessageDispatch();
	const { t } = useTranslation();

	useEffect(() => {
		const fn = () => {
			toast({
				type: 'info',
				options: { isPersistent: true },
				message: (
					<Box
						display='flex'
						alignItems='center'
						className={css`
							gap: 8px;
						`}
					>
						{t('An_update_is_available')}
						<Button primary small onClick={() => window.location.reload()}>
							{t('Reload_to_update')}
						</Button>
					</Box>
				),
			});
		};
		document.addEventListener('client_changed', fn);

		return () => {
			document.removeEventListener('client_changed', fn);
		};
	}, [t, toast]);
};
