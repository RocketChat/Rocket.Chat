import { useEffect, useMemo, useState } from 'react';

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

	const [hours, minutes, seconds] = useMemo(() => {
		const totalSeconds = Math.floor(ellapsedTime / 1000);

		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = Math.floor(totalSeconds % 60);

		return [hours.toString().padStart(2, '0'), minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')];
	}, [ellapsedTime]);

	return (
		<time aria-hidden>
			{hours !== '00' ? `${hours}:` : ''}
			{minutes}:{seconds}
		</time>
	);
};

export default VoipTimer;
