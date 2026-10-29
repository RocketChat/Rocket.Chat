import { Box } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';

export type CallTimerProps = {
	/** When the call started. Absent until the call itself has been read, which is a render or two after mount. */
	startAt?: Date;
};

/**
 * How long a call has been going.
 *
 * Shared, because there were two of these — this one and `ui-voip`'s — counting the same thing from the same
 * shape of prop and disagreeing about the details that matter. This is the version that survives a start which
 * arrives late, which is the normal case: the conference is read a render after the timer mounts, and a timer
 * that captured its start once anchored a call already minutes old at zero and counted up from there.
 */
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
		// `role='timer'` because that is what it is, and because a bare `<time>` had no role and no name, so
		// nothing could refer to it — neither assistive technology nor a test.
		//
		// `aria-live='off'` said out loud rather than left to the role's default: this counts up every second for
		// the length of the call, and a screen reader reading each tick would talk over everything else in it.
		<Box is='time' role='timer' aria-live='off' dateTime={`PT${hours}H${minutes}M${seconds}S`} fontScale='p1b'>
			{hoursStr !== '00' ? `${hours}:` : ''}
			{minutesStr}:{secondsStr}
		</Box>
	);
};

export default CallTimer;
