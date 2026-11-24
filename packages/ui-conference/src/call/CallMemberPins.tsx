import ParticipantPin from './ParticipantPin';
import ScreenPin from './ScreenPin';
import { useCallPins, useCallState } from './context';

export type CallMemberPinsProps = {
	memberId: string;
};

/** What a row of the members panel can pin: the person, and their screen while they share one. */
const CallMemberPins = ({ memberId }: CallMemberPinsProps) => {
	const { self, remoteParticipants } = useCallState();
	const { shares } = useCallPins();

	const participant = memberId === self.id ? self : remoteParticipants.find(({ id }) => id === memberId);
	if (!participant) {
		return null;
	}

	const share = shares.find(({ id }) => id === memberId);

	return (
		<>
			<ParticipantPin participantId={memberId} name={participant.displayName} />
			{share && <ScreenPin share={share} icon='desktop' />}
		</>
	);
};

export default CallMemberPins;
