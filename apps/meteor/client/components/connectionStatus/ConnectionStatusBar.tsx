import { Icon } from '@rocket.chat/fuselage';
import { useConnectionStatus, useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler, FC } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import './ConnectionStatusBar.styles.css';

// TODO: frontend chapter day - fix unknown translation keys

const getReconnectCountdown = (retryTime: number): number => {
	const timeDiff = retryTime - Date.now();
	return (timeDiff > 0 && Math.round(timeDiff / 1000)) || 0;
};

const useReconnectCountdown = (
	retryTime: number | undefined,
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline',
): number => {
	const reconnectionTimerRef = useRef<ReturnType<typeof setInterval>>();
	const [reconnectCountdown, setReconnectCountdown] = useState(() => (retryTime ? getReconnectCountdown(retryTime) : 0));

	useEffect(() => {
		if (status === 'waiting') {
			if (reconnectionTimerRef.current) {
				return;
			}

			reconnectionTimerRef.current = setInterval(() => {
				retryTime && setReconnectCountdown(getReconnectCountdown(retryTime));
			}, 500);
			return;
		}

		reconnectionTimerRef.current && clearInterval(reconnectionTimerRef.current);
		reconnectionTimerRef.current = undefined;
	}, [retryTime, status]);

	useEffect(
		() => (): void => {
			reconnectionTimerRef.current && clearInterval(reconnectionTimerRef.current);
		},
		[],
	);

	return reconnectCountdown;
};

const ConnectionStatusBar: FC = function ConnectionStatusBar() {
	const { connected, retryTime, status, reconnect } = useConnectionStatus();
	const reconnectCountdown = useReconnectCountdown(retryTime, status);
	const t = useTranslation();

	if (connected) {
		return null;
	}

	const handleRetryClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		reconnect?.();
	};

	return (
		<div className='ConnectionStatusBar' role='alert'>
			<strong>
				<Icon name='warning' /> {t('meteor_status' as Parameters<typeof t>[0], { context: status })}
			</strong>

			{status === 'waiting' && <> {t('meteor_status_reconnect_in', { count: reconnectCountdown })}</>}

			{['waiting', 'offline'].includes(status) && (
				<>
					{' '}
					<a className='ConnectionStatusBar__retry-link' href='#' onClick={handleRetryClick}>
						{t('meteor_status_try_now' as Parameters<typeof t>[0], { context: status })}
					</a>
				</>
			)}
		</div>
	);
};

export default ConnectionStatusBar;
