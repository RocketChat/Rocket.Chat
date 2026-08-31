import { Box } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';

type CallTimerProps = { startAt?: Date };

const CallTimer = ({ startAt }: CallTimerProps) => {
	// The moment is ticked and the elapsed time derived from it, rather than the start being captured once: the
	// conference this reads from arrives a render later than the timer mounts, so freezing the start anchored a
	// call that had been running for minutes at zero and left it counting from there.
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 1000);

		return () => clearInterval(interval);
	}, []);

	const start = startAt?.getTime();
	// Nothing is known about the call's age until it arrives, and a clock skewed ahead of the server must not
	// count backwards.
	const elapsedTime = start === undefined ? 0 : Math.max(0, now - start);

	const totalSeconds = Math.floor(elapsedTime / 1000);

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	const hoursStr = hours.toString().padStart(2, '0');
	const minutesStr = minutes.toString().padStart(2, '0');
	const secondsStr = seconds.toString().padStart(2, '0');

	return (
		// `role='timer'` because that is what it is: a live region counting up. A bare `<time>` had no role and no
		// name, so nothing could refer to it — neither assistive technology nor a test.
		<Box is='time' role='timer' dateTime={`PT${hours}H${minutes}M${seconds}S`} fontScale='p1b'>
			{hoursStr !== '00' ? `${hours}:` : ''}
			{minutesStr}:{secondsStr}
		</Box>
	);
};

export default CallTimer;
