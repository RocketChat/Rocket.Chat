import { CallTimer, type CallTimerProps } from '@rocket.chat/ui-client';
import { useState } from 'react';

export type VoipTimerProps = CallTimerProps;

/**
 * `CallTimer`, counting from mount when nothing says when the call began.
 *
 * The shared timer holds at zero without a `startAt`, which is what a conference wants: the call is read a render
 * after the window opens, and a timer that guessed would be wrong for that render and then jump. A VoIP session
 * has no such later answer — `OngoingCall` renders this with no `startAt` at all, and `startedAt` is optional on
 * the session besides — so here the mount is the best start there is, and holding at zero would freeze the clock
 * for the whole call.
 */
const VoipTimer = ({ startAt }: VoipTimerProps) => {
	const [mountedAt] = useState(() => new Date());

	return <CallTimer startAt={startAt ?? mountedAt} />;
};

export default VoipTimer;
