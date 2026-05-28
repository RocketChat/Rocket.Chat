import { PeerCard, StreamCard } from '../../components';
import type { RemoteParticipantInfo } from '../../context/MediaCallViewContext';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

/**
 * Cards for a single remote participant: their avatar tile (with embedded
 * camera video if active) and, when present, a separate StreamCard for their
 * screen share.
 */
const ParticipantCards = ({ participant }: { participant: RemoteParticipantInfo }) => {
	const [cameraRefCallback] = usePlayMediaStream(participant.cameraStream ?? null);
	const [screenRefCallback] = usePlayMediaStream(participant.screenStream ?? null);
	const cameraActive = Boolean(participant.cameraStream);
	const screenActive = Boolean(participant.screenStream);
	return (
		<>
			<PeerCard
				displayName={participant.displayName}
				avatarUrl={participant.avatarUrl}
				muted={participant.muted}
				held={participant.held}
				videoActive={cameraActive}
				videoRef={cameraRefCallback}
			/>
			{screenActive && (
				<StreamCard autoHeight maxHeight={240}>
					<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={screenRefCallback}>
						<track kind='captions' />
					</video>
				</StreamCard>
			)}
		</>
	);
};

export default ParticipantCards;
