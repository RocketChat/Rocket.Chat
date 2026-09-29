import { useMemo } from 'react';

import { useCallState } from './context';
import type { MembersInCall } from '../components/CallMembersPanel/CallMembersPanel';
import CallMembersPanel from '../components/CallMembersPanel/CallMembersPanel';

export type EmbeddedCallMembersPanelProps = {
	onClose: () => void;
};

/** The members panel for a call running in this window, which can say who is muted or talking. */
const EmbeddedCallMembersPanel = ({ onClose }: EmbeddedCallMembersPanelProps) => {
	const { self, remoteParticipants } = useCallState();

	const inCall = useMemo((): MembersInCall => {
		const mutedMembers = new Set(remoteParticipants.filter(({ muted }) => muted).map(({ id }) => id));
		if (self.muted) {
			mutedMembers.add(self.id);
		}

		const audioStreams = new Map(remoteParticipants.map(({ id, audioStream }) => [id, audioStream]));
		audioStreams.set(self.id, self.microphoneStream);

		return { mutedMembers, audioStreams };
	}, [self.id, self.muted, self.microphoneStream, remoteParticipants]);

	return <CallMembersPanel inCall={inCall} onClose={onClose} />;
};

export default EmbeddedCallMembersPanel;
