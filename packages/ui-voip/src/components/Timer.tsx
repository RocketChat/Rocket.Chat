import { useEffect, useState } from 'react';

type VoipTimerProps = { startAt?: Date };

const VoipTimer = ({ startAt }: VoipTimerProps) => {
	const [start] = useState(() => {
		if (!startAt) {
			return Date.now();
		}
		return startAt.getTime();
	});

	const [ellapsedTime, setEllapsedTime] = useState(() => {
		if (!start) {
			return 0;
		}
		return Date.now() - start;
	});

	useEffect(() => {
		const interval = setInterval(() => {
			setEllapsedTime(() => {
				const now = Date.now();

				return now - start;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [start]);

	const totalSeconds = Math.floor(ellapsedTime / 1000);

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	const hoursStr = hours.toString().padStart(2, '0');
	const minutesStr = minutes.toString().padStart(2, '0');
	const secondsStr = seconds.toString().padStart(2, '0');

	return (
		<time dateTime={`PT${hours}H${minutes}M${seconds}S`}>
			{hoursStr !== '00' ? `${hours}:` : ''}
			{minutesStr}:{secondsStr}
		</time>
	);
};

export default VoipTimer;
