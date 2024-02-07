import { Box, Icon } from '@rocket.chat/fuselage';
import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useReconnectCountdown } from './useReconnectCountdown';

function ConnectionStatusBar() {
	const { connected, retryTime, status, reconnect } = useConnectionStatus();
	const reconnectCountdown = useReconnectCountdown(retryTime, status);
	const { t } = useTranslation();

	if (connected) {
		return null;
	}

	const handleRetryClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		reconnect?.();
	};

	return (
		<Box
			color='status-font-on-warning'
			bg='status-background-warning'
			position='fixed'
			zIndex={1000000}
			insetBlockStart={0}
			p={2}
			width='100%'
			textAlign='center'
			borderBlockEndWidth={1}
			role='alert'
		>
			<Icon name='warning' />{' '}
			<Box is='span' withRichContent>
				<strong>{t('meteor_status', { context: status })}</strong>
				{status === 'waiting' && <> {t('meteor_status_reconnect_in', { count: reconnectCountdown })}</>}
				{['waiting', 'offline'].includes(status) && (
					<>
						{' '}
						<a href='#' onClick={handleRetryClick} role='button'>
							{t('meteor_status_try_now', { context: status })}
						</a>
					</>
				)}
			</Box>
		</Box>
	);
}

export default ConnectionStatusBar;
