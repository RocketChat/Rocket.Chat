import { useEffect, useRef, useState } from 'react';

const getReconnectCountdown = (retryTime: number): number => {
	const timeDiff = retryTime - Date.now();
	return (timeDiff > 0 && Math.round(timeDiff / 1000)) || 0;
};

export const useReconnectCountdown = (
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
