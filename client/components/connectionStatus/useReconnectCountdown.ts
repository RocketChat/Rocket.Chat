import { useEffect, useRef, useState } from 'react';

import { ConnectionStatusContextValue } from '../../contexts/ConnectionStatusContext';

const getReconnectCountdown = (retryTime: number): number => {
	const timeDiff = retryTime - Date.now();
	return (timeDiff > 0 && Math.round(timeDiff / 1000)) || 0;
};

export const useReconnectCountdown = (retryTime: number, status: ConnectionStatusContextValue['status']): number => {
	const reconnectionTimerRef = useRef<number>();
	const [reconnectCountdown, setReconnectCountdown] = useState(() => getReconnectCountdown(retryTime));

	useEffect(() => {
		if (status === 'waiting') {
			if (reconnectionTimerRef.current) {
				return;
			}

			reconnectionTimerRef.current = window.setInterval(() => {
				setReconnectCountdown(getReconnectCountdown(retryTime));
			}, 500);
			return;
		}

		window.clearInterval(reconnectionTimerRef.current);
		reconnectionTimerRef.current = undefined;
	}, [retryTime, status]);

	useEffect(() => (): void => {
		clearInterval(reconnectionTimerRef.current);
	}, []);

	return reconnectCountdown;
};
