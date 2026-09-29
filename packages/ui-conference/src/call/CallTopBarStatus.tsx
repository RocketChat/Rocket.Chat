import { useMemo } from 'react';

import { useCallActions, useCallState } from './context';
import CallPresenting from '../components/CallPresenting';

/** Who is presenting in the call running in this window, for its top bar. */
const CallTopBarStatus = () => {
	const { self, remoteParticipants } = useCallState();
	const { toggleScreenShare } = useCallActions();

	const presenters = useMemo(
		() => [
			...(self.screenSharing ? [{ name: self.displayName, avatarUrl: self.avatarUrl, isLocal: true }] : []),
			...remoteParticipants
				.filter(({ screenStream }) => screenStream)
				.map(({ displayName, avatarUrl }) => ({ name: displayName, avatarUrl })),
		],
		[self.screenSharing, self.displayName, self.avatarUrl, remoteParticipants],
	);

	return <CallPresenting presenters={presenters} onStopPresenting={toggleScreenShare} />;
};

export default CallTopBarStatus;
