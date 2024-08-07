import type { FC } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import { setPreciseInterval } from '../utils/setPreciseInterval';

const VoiceCallTimer: FC<{ startAt?: Date }> = ({ startAt = new Date() }) => {
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
		<span>
			{hours !== '00' ? `${hours}:` : ''}
			{minutes}:{seconds}
		</span>
	);
};

export default VoiceCallTimer;
