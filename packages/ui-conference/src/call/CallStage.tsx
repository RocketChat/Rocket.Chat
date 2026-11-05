import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import type { RemoteParticipantInfo } from './context.js';
import { useActiveSpeakerId } from './hooks/useActiveSpeakerId.js';
import { useElementSize } from './hooks/useElementSize.js';
import { useFeaturedScreen } from './hooks/useFeaturedScreen.js';
import type { TileReaction } from './lib/reactions.js';
import type { StageSelf } from './lib/stageTiles.js';
import { buildStageTiles, pickFeaturedTile, spotlightOrientation } from './lib/stageTiles.js';
import GridLayout from './stage/GridLayout.js';
import ScreenShareLayout from './stage/ScreenShareLayout.js';
import SidebarLayout from './stage/SidebarLayout.js';
import SpotlightLayout from './stage/SpotlightLayout.js';
import { stageStyles } from './stage/stageStyles.js';

export type StageLayout = 'grid' | 'spotlight' | 'sidebar';

export type CallStageProps = {
	localParticipant: StageSelf;
	remoteParticipants: RemoteParticipantInfo[];
	onStopLocalScreenShare?: () => void;
	/** Map from participantId → 1-based queue position for the raise-hand badge. */
	handPositions?: Record<string, number>;
	/** Map from participantId → their latest reaction, shown on their tile. */
	reactions?: Record<string, TileReaction>;
	/** Which layout to use when no screen share is active. Defaults to `'grid'`. */
	layout?: StageLayout;
};

/** Everyone's tiles in the chosen layout, or, while anyone shares a screen, that screen with the tiles beside it. */
const CallStage = ({
	localParticipant,
	remoteParticipants,
	onStopLocalScreenShare,
	handPositions,
	reactions,
	layout = 'grid',
}: CallStageProps) => {
	const tiles = useMemo(
		() => buildStageTiles(localParticipant, remoteParticipants, handPositions, reactions),
		[localParticipant, remoteParticipants, handPositions, reactions],
	);

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
