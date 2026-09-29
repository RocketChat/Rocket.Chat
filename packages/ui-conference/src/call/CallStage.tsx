import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import type { RemoteParticipantInfo } from './context';
import { useActiveSpeakerId } from './hooks/useActiveSpeakerId';
import { useElementSize } from './hooks/useElementSize';
import { useFeaturedScreen } from './hooks/useFeaturedScreen';
import type { StageSelf } from './lib/stageTiles';
import { buildStageTiles, pickFeaturedTile, spotlightOrientation } from './lib/stageTiles';
import GridLayout from './stage/GridLayout';
import ScreenShareLayout from './stage/ScreenShareLayout';
import SidebarLayout from './stage/SidebarLayout';
import SpotlightLayout from './stage/SpotlightLayout';
import { stageStyles } from './stage/stageStyles';

export type StageLayout = 'grid' | 'spotlight' | 'sidebar';

export type CallStageProps = {
	localParticipant: StageSelf;
	remoteParticipants: RemoteParticipantInfo[];
	onStopLocalScreenShare?: () => void;
	/** Which layout to use when no screen share is active. Defaults to `'grid'`. */
	layout?: StageLayout;
};

/** Everyone's tiles in the chosen layout, or, while anyone shares a screen, that screen with the tiles beside it. */
const CallStage = ({ localParticipant, remoteParticipants, onStopLocalScreenShare, layout = 'grid' }: CallStageProps) => {
	const tiles = useMemo(() => buildStageTiles(localParticipant, remoteParticipants), [localParticipant, remoteParticipants]);

	const screens = useFeaturedScreen(localParticipant, remoteParticipants);

	const audioParticipants = useMemo(() => remoteParticipants.map((p) => ({ id: p.id, audioStream: p.audioStream })), [remoteParticipants]);
	const activeSpeakerId = useActiveSpeakerId(audioParticipants, remoteParticipants[0]?.id ?? localParticipant.id);

	const [stageRef, stageSize] = useElementSize();
	const orientation = spotlightOrientation(stageSize);

	const renderLayout = () => {
		if (screens.featured) {
			return (
				<ScreenShareLayout
					featured={screens.featured}
					others={screens.others}
					tiles={tiles}
					orientation={orientation}
					onPin={screens.pin}
					onStopLocalScreenShare={onStopLocalScreenShare}
				/>
			);
		}

		const featured = pickFeaturedTile(tiles, activeSpeakerId, localParticipant.id);

		if (layout === 'spotlight') {
			return <SpotlightLayout featured={featured} self={tiles.find((t) => t.id === localParticipant.id)} />;
		}

		if (layout === 'sidebar') {
			return (
				<SidebarLayout
					featured={featured}
					tiles={tiles}
					activeSpeakerId={activeSpeakerId}
					selfId={localParticipant.id}
					stageSize={stageSize}
					orientation={orientation}
				/>
			);
		}

		return <GridLayout tiles={tiles} activeSpeakerId={activeSpeakerId} selfId={localParticipant.id} />;
	};

	return (
		<Box className={stageStyles} ref={stageRef}>
			{renderLayout()}
		</Box>
	);
};

export default CallStage;
