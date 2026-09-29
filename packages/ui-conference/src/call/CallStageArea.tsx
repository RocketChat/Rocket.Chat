import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CallStage, { type StageLayout } from './CallStage';
import { useCallActions, useCallState } from './context';

export type CallStageAreaProps = {
	layout: StageLayout;
};

/** The tiles of a call running in this window. */
const CallStageArea = ({ layout }: CallStageAreaProps) => {
	const { t } = useTranslation();
	const { self, remoteParticipants } = useCallState();
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
		}),
		[self.id, self.displayName, self.avatarUrl, self.muted, self.cameraStream, self.screenStream],
	);

	return (
		<Box
			is='section'
			aria-label={t('Voice_call')}
			width='full'
			height='full'
			backgroundColor='transparent'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			minHeight={0}
		>
			<CallStage
				localParticipant={localParticipant}
				remoteParticipants={remoteParticipants}
				onStopLocalScreenShare={toggleScreenShare}
				layout={layout}
			/>
		</Box>
	);
};

export default CallStageArea;
