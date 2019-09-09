import { Meteor } from 'meteor/meteor';
import React, { useEffect, useRef, useState } from 'react';

import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../hooks/useTranslation';
import { Icon } from '../basic/Icon';

export function ConnectionStatusAlert() {
	const {
		connected,
		retryTime,
		status,
	} = useReactiveValue(() => ({ ...Meteor.status() }));
	const reconnectionTimerRef = useRef();
	const [reconnectCountdown, setReconnectCountdown] = useState(0);
	const t = useTranslation();

	useEffect(() => {
		if (status === 'waiting') {
			if (reconnectionTimerRef.current) {
				return;
			}

			reconnectionTimerRef.current = setInterval(() => {
				const timeDiff = retryTime - Date.now();
				setReconnectCountdown((timeDiff > 0 && Math.round(timeDiff / 1000)) || 0);
			}, 500);
			return;
		}

		clearInterval(reconnectionTimerRef.current);
		reconnectionTimerRef.current = null;
	}, [retryTime, status]);

	useEffect(() => () => {
		clearInterval(reconnectionTimerRef.current);
	}, []);

	if (connected) {
		return null;
	}

	const handleRetryClick = (event) => {
		event.preventDefault();
		Meteor.reconnect();
	};

	return <div className='ConnectionStatusAlert' role='alert'>
		<strong>
			<Icon icon='warning' /> {t('meteor_status', { context: status })}
		</strong>

		{status === 'waiting' && <>
			{' '}
			{t('meteor_status_reconnect_in', { count: reconnectCountdown })}
		</>}

		{['waiting', 'offline'].includes(status) && <>
			{' '}
			<a
				href='#'
				className='ConnectionStatusAlert__link'
				onClick={handleRetryClick}
			>
				{t('meteor_status_try_now', { context: status })}
			</a>
		</>}
	</div>;
}
