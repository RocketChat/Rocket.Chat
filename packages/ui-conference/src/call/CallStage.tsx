import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import type { RemoteParticipantInfo } from './context';
import { collectScreenShares } from './lib/screenShares';
import type { StageSelf } from './lib/stageTiles';
import { buildStageTiles } from './lib/stageTiles';
import GridLayout from './stage/GridLayout';
import { stageStyles } from './stage/stageStyles';

export type CallStageProps = {
	localParticipant: StageSelf;
	remoteParticipants: RemoteParticipantInfo[];
};

/** Everyone's tiles in a grid, with every screen being shared as a tile of its own. */
const CallStage = ({ localParticipant, remoteParticipants }: CallStageProps) => {
	const tiles = useMemo(() => buildStageTiles(localParticipant, remoteParticipants), [localParticipant, remoteParticipants]);

	const { id, screenStream } = localParticipant;
	const screens = useMemo(() => collectScreenShares({ id, screenStream }, remoteParticipants), [id, screenStream, remoteParticipants]);

	return (
		<Box className={stageStyles}>
			<GridLayout screens={screens} tiles={tiles} selfId={id} />
		</Box>
	);
};

export default CallStage;
