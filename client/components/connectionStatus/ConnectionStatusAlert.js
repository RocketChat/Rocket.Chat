import { Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useConnectionStatus } from '../../contexts/ConnectionStatusContext';
import { useTranslation } from '../../contexts/TranslationContext';
import PlainText from '../PlainText';
import { useReconnectCountdown } from './useReconnectCountdown';

const ConnectionStatusAlert = () => {
	const { connected, retryTime, status, reconnect } = useConnectionStatus();
	const reconnectCountdown = useReconnectCountdown(retryTime, status);
	const t = useTranslation();

	if (connected) {
		return null;
	}

	const handleRetryClick = (event) => {
		event.preventDefault();
		reconnect && reconnect();
	};

	return <PlainText
		is='div'
		role='alert'
		type='warning'
		position='fixed'
		zIndex={1000000}
		insetBlockStart={0}
		width='100%'
		padding={4}
		textAlign='center'
		backgroundColor='#ffecad'
	>
		<strong>
			<Icon name='warning' /> {t('meteor_status', { context: status })}
		</strong>

		{status === 'waiting' && <>
			{' '}
			{t('meteor_status_reconnect_in', { count: reconnectCountdown })}
		</>}

		{['waiting', 'offline'].includes(status) && <>
			{' '}
			<button type='button' onClick={handleRetryClick}>
				{t('meteor_status_try_now', { context: status })}
			</button>
		</>}
	</PlainText>;
};

export default ConnectionStatusAlert;
