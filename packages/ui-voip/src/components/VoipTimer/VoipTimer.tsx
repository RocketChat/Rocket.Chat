import { useEffect, useMemo, useState } from 'react';

import { setPreciseInterval } from '../../utils/setPreciseInterval';

type VoipTimerProps = { startAt?: Date };

const VoipTimer = ({ startAt = new Date() }: VoipTimerProps) => {
	const [start] = useState(startAt.getTime());
	const [ellapsedTime, setEllapsedTime] = useState(0);

	useEffect(() => {
		return setPreciseInterval(() => {
			setEllapsedTime(Date.now() - start);
		}, 1000);
	});

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
