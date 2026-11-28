import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCallActions, useCallState } from './context.js';
import { nameRaisedHands } from './lib/raisedHands.js';
import CallPresenting from '../components/CallPresenting.js';
import CallRaisedHands from '../components/CallRaisedHands.js';
import { useConferenceCall } from '../context/ConferenceContext.js';

/** Who is presenting and who is waiting to speak in the call running in this window, for its top bar. */
const CallTopBarStatus = () => {
	const { t } = useTranslation();
	const { members } = useConferenceCall();
	const { self, remoteParticipants, raisedHands } = useCallState();
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

	// The call reports hands by participant id; the membership is what names them.
	const hands = useMemo(() => nameRaisedHands(raisedHands, members, t('User'), self.id), [raisedHands, members, t, self.id]);

	return (
		<>
			<CallPresenting presenters={presenters} onStopPresenting={toggleScreenShare} />
			<CallRaisedHands hands={hands} />
		</>
	);
};

export default CallTopBarStatus;
