import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { ModalContext } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useIdleActiveEvents } from '../hooks/useIdleActiveEvents';

export const AutoupdateToastMessage = () => {
	const { t } = useTranslation();
	// An open modal may be waiting on something the user left the window to get (e.g. a two-factor code).
	const hasOpenModal = Boolean(useContext(ModalContext)?.currentModal.component);
	useIdleActiveEvents({ id: 'autoupdate', awayOnWindowBlur: true }, () => {
		if (hasOpenModal) {
			return;
		}
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
