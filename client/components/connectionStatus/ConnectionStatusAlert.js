import { Icon } from '@rocket.chat/fuselage';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useConnectionStatus, useReconnect } from '../../contexts/ConnectionStatusContext';
import { useTranslation } from '../../contexts/TranslationContext';

const getReconnectCountdown = (retryTime) => {
	const timeDiff = retryTime - Date.now();
	return (timeDiff > 0 && Math.round(timeDiff / 1000)) || 0;
};

const useReconnectCountdown = (retryTime, status) => {
	const reconnectionTimerRef = useRef();
	const [reconnectCountdown, setReconnectCountdown] = useState(() => getReconnectCountdown(retryTime));

	useEffect(() => {
		if (status === 'waiting') {
			if (reconnectionTimerRef.current) {
				return;
			}

			reconnectionTimerRef.current = setInterval(() => {
				setReconnectCountdown(getReconnectCountdown(retryTime));
			}, 500);
			return;
		}

		clearInterval(reconnectionTimerRef.current);
		reconnectionTimerRef.current = null;
	}, [retryTime, status]);

	useEffect(() => () => {
		clearInterval(reconnectionTimerRef.current);
	}, []);

	return reconnectCountdown;
};

const Container = styled.div`
	position: fixed;
	z-index: 1000000;
	top: 0;

	width: 100%;
	padding: 2px;

	text-align: center;

	color: #916302;
	border-bottom-width: 1px;
	background-color: #fffdf9;
`;

const RetryLink = styled.a`
	color: var(--color-blue);
`;

export function ConnectionStatusAlert() {
	const { connected, retryTime, status } = useConnectionStatus();
	const reconnect = useReconnect();
	const reconnectCountdown = useReconnectCountdown(retryTime, status);
	const t = useTranslation();

	if (connected) {
		return null;
	}

	const handleRetryClick = (event) => {
		event.preventDefault();
		reconnect();
	};

	return <Container role='alert'>
		<strong>
			<Icon name='warning' /> {t('meteor_status', { context: status })}
		</strong>

		{status === 'waiting' && <>
			{' '}
			{t('meteor_status_reconnect_in', { count: reconnectCountdown })}
		</>}

		{['waiting', 'offline'].includes(status) && <>
			{' '}
			<RetryLink href='#' onClick={handleRetryClick}>
				{t('meteor_status_try_now', { context: status })}
			</RetryLink>
		</>}
	</Container>;
}
