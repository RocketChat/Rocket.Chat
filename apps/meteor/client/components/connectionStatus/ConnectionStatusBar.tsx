import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Palette } from '@rocket.chat/fuselage';
import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useReconnectCountdown } from './useReconnectCountdown';

const connectionStatusBarStyle = css`
	color: ${Palette.statusColor['status-font-on-warning']};
	background-color: ${Palette.surface['surface-tint']};
	border-color: ${Palette.statusColor['status-font-on-warning']};

	position: fixed;
	z-index: 1000000;

	display: flex;
	justify-content: space-between;
	align-items: center;

	.rcx-connection-status-bar--content-wrapper {
		display: flex;
		align-items: center;
		column-gap: 8px;
	}
	.rcx-connection-status-bar--content {
		display: flex;
		align-items: center;
		column-gap: 8px;
	}
`;
function ConnectionStatusBar() {
	const { connected, retryTime, status, reconnect } = useConnectionStatus();
	const reconnectCountdown = useReconnectCountdown(retryTime, status);
	const { t } = useTranslation();

	if (connected) {
		return null;
	}

	return (
		<Box
			className={connectionStatusBarStyle}
			rcx-connection-status-bar
			insetBlockStart={0}
			pb={4}
			pi={12}
			width='100%'
			borderBlockEndWidth={2}
			role='alert'
			fontScale='p2'
		>
			<span className='rcx-connection-status-bar--content-wrapper'>
				<Icon name='warning' />
				<span className='rcx-connection-status-bar--content'>
					<strong>{t('meteor_status', { context: status })}</strong>
					{['waiting', 'failed', 'offline'].includes(status) && (
						<Box is='span' color='default' fontScale='p2'>
							{status === 'waiting' ? t('meteor_status_reconnect_in', { count: reconnectCountdown }) : t('meteor_status_try_again_later')}
						</Box>
					)}
				</span>
			</span>
			<Button primary onClick={reconnect} small disabled={['connected', 'connecting'].includes(status)}>
				{t('Connect')}
			</Button>
		</Box>
	);
}

export default ConnectionStatusBar;
