import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useIdleActiveEvents } from '../hooks/useIdleActiveEvents';

export const AutoupdateToastMessage = () => {
	const { t } = useTranslation();
	useIdleActiveEvents({ id: 'autoupdate', awayOnWindowBlur: true }, () => {
		window.location.reload();
	});

	return (
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
	);
};
