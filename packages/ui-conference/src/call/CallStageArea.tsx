import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CallReactions, { type CallReaction } from './CallReactions';
import CallStage, { type StageLayout } from './CallStage';
import { useCallActions, useCallState } from './context';
import { handPositionsOf } from './lib/raisedHands';

export type CallStageAreaProps = {
	layout: StageLayout;
};

/** The tiles of a call running in this window, with the reactions rising over them. */
const CallStageArea = ({ layout }: CallStageAreaProps) => {
	const { t } = useTranslation();
	const { self, remoteParticipants, raisedHands, activeReactions } = useCallState();
	const { toggleScreenShare } = useCallActions();

	const localParticipant = useMemo(
		() => ({
			id: self.id,
			displayName: self.displayName,
			avatarUrl: self.avatarUrl,
			muted: self.muted,
			held: false,
			cameraStream: self.cameraStream ?? null,
			screenStream: self.screenStream ?? null,
			audioStream: self.microphoneStream ?? null,
			// Said on the reader's own tile only: a claim about someone else's encoder is not one this client can make.
			sendHeight: self.sendResolution?.height,
		}),
		[
			self.id,
			self.displayName,
			self.avatarUrl,
			self.muted,
			self.cameraStream,
			self.screenStream,
			self.microphoneStream,
			self.sendResolution?.height,
		],
	);

	const handPositions = useMemo(() => handPositionsOf(raisedHands), [raisedHands]);

	// Named from everyone in the call rather than from whoever has a tile, so a sender without one still arrives named.
	const reactions = useMemo((): CallReaction[] => {
		const names = new Map([localParticipant, ...remoteParticipants].map(({ id, displayName }) => [id, displayName]));

		return activeReactions.map(({ id, emoji, participantId }) => ({ id, emoji, name: names.get(participantId) }));
	}, [activeReactions, localParticipant, remoteParticipants]);

	return (
		<Box
			is='section'
			aria-label={t('Video_Conference')}
			width='full'
			height='full'
			backgroundColor='transparent'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			minHeight={0}
		>
			{/* Positioned so the reactions rising over the call have something to be positioned against. */}
			<Box position='relative' display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
				<CallStage
					localParticipant={localParticipant}
					remoteParticipants={remoteParticipants}
					onStopLocalScreenShare={toggleScreenShare}
					handPositions={handPositions}
					layout={layout}
				/>
				<CallReactions reactions={reactions} />
			</Box>
		</Box>
	);
};

export default CallStageArea;
