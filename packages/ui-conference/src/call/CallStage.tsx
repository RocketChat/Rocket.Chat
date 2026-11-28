import { Box } from '@rocket.chat/fuselage';
import { useCallback, useMemo } from 'react';

import type { RemoteParticipantInfo } from './context.js';
import { useActiveSpeakerId } from './hooks/useActiveSpeakerId.js';
import { useElementSize } from './hooks/useElementSize.js';
import { PinFocusProvider, usePinFocusScope } from './hooks/usePinFocus.js';
import type { TileReaction } from './lib/reactions.js';
import type { ScreenShare } from './lib/screenShares.js';
import type { StageSelf } from './lib/stageTiles.js';
import { buildStageTiles, pinnedOrFeaturedTile, spotlightOrientation } from './lib/stageTiles.js';
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
	/** Which layout to use when no screen share is on the stage. Defaults to `'grid'`. */
	layout?: StageLayout;
	pinnedId: string | null;
	shares: ScreenShare[];
	screenOnStage: ScreenShare | null;
};

/** Everyone's tiles in the chosen layout, or the shared screen on the stage with the tiles beside it. */
const CallStage = ({
	localParticipant,
	remoteParticipants,
	onStopLocalScreenShare,
	handPositions,
	reactions,
	layout = 'grid',
	pinnedId,
	shares,
	screenOnStage,
}: CallStageProps) => {
	const tiles = useMemo(
		() => buildStageTiles(localParticipant, remoteParticipants, handPositions, reactions),
		[localParticipant, remoteParticipants, handPositions, reactions],
	);

	const audioParticipants = useMemo(() => remoteParticipants.map((p) => ({ id: p.id, audioStream: p.audioStream })), [remoteParticipants]);
	const activeSpeakerId = useActiveSpeakerId(audioParticipants, remoteParticipants[0]?.id ?? localParticipant.id);

	const [stageRef, stageSize] = useElementSize();
	const orientation = spotlightOrientation(stageSize);

	const [pinFocus, pinFocusFallbackRef] = usePinFocusScope();
	const ref = useCallback(
		(node: HTMLElement) => {
			const stopMeasuring = stageRef(node);
			pinFocusFallbackRef(node);
			return () => {
				if (typeof stopMeasuring === 'function') stopMeasuring();
				pinFocusFallbackRef(null);
			};
		},
		[stageRef, pinFocusFallbackRef],
	);

	const renderLayout = () => {
		if (screenOnStage) {
			return (
				<ScreenShareLayout
					featured={screenOnStage}
					others={shares.filter(({ id }) => id !== screenOnStage.id)}
					tiles={tiles}
					orientation={orientation}
					onStopLocalScreenShare={onStopLocalScreenShare}
				/>
			);
		}

		const featured = pinnedOrFeaturedTile(tiles, pinnedId, activeSpeakerId, localParticipant.id);
		// The grid has no large view and Spotlight no thumbnails for the shares.
		const pinNeedsSidebar = featured.id === pinnedId && (layout === 'grid' || shares.length > 0);

		if (layout === 'sidebar' || pinNeedsSidebar) {
			return (
				<SidebarLayout
					featured={featured}
					tiles={tiles}
					activeSpeakerId={activeSpeakerId}
					selfId={localParticipant.id}
					stageSize={stageSize}
					orientation={orientation}
					screens={shares}
				/>
			);
		}

		if (layout === 'spotlight') {
			return <SpotlightLayout featured={featured} self={tiles.find((t) => t.id === localParticipant.id)} />;
		}

		return <GridLayout tiles={tiles} activeSpeakerId={activeSpeakerId} selfId={localParticipant.id} screens={shares} />;
	};

	return (
		<Box className={stageStyles} ref={ref} tabIndex={-1}>
			<PinFocusProvider value={pinFocus}>{renderLayout()}</PinFocusProvider>
		</Box>
	);
};

export default CallStage;
