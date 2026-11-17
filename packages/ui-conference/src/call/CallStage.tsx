import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import type { RemoteParticipantInfo } from './context';
import { useActiveSpeakerId } from './hooks/useActiveSpeakerId';
import { useElementSize } from './hooks/useElementSize';
import type { FeaturedScreen } from './hooks/useFeaturedScreen';
import { useFocusAfterPin } from './hooks/useFocusAfterPin';
import type { TileReaction } from './lib/reactions';
import type { StageSelf } from './lib/stageTiles';
import { buildStageTiles, pinnedOrFeaturedTile, spotlightOrientation } from './lib/stageTiles';
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
	/** Map from participantId → 1-based queue position for the raise-hand badge. */
	handPositions?: Record<string, number>;
	/** Map from participantId → their latest reaction, shown on their tile. */
	reactions?: Record<string, TileReaction>;
	/** Which layout to use when no screen share is on the stage. Defaults to `'grid'`. */
	layout?: StageLayout;
	screens: FeaturedScreen;
	/** Whom the reader pinned to see large. Without `onTogglePin`, tiles offer no pin. */
	pinnedId?: string | null;
	onTogglePin?: (participantId: string) => void;
};

/** Everyone's tiles in the chosen layout, or the shared screen on the stage with the tiles beside it. */
const CallStage = ({
	localParticipant,
	remoteParticipants,
	onStopLocalScreenShare,
	handPositions,
	reactions,
	layout = 'grid',
	screens,
	pinnedId = null,
	onTogglePin,
}: CallStageProps) => {
	const [focusPinOf, requestFocus] = useFocusAfterPin();

	const tiles = useMemo(() => {
		const built = buildStageTiles(localParticipant, remoteParticipants, handPositions, reactions);
		if (!onTogglePin) {
			return built;
		}
		return built.map((tile) => ({
			...tile,
			pin: {
				pinned: tile.id === pinnedId,
				restoreFocus: tile.id === focusPinOf,
				onToggle: (hadFocus: boolean) => {
					onTogglePin(tile.id);
					if (hadFocus) {
						requestFocus(tile.id);
					}
				},
			},
		}));
	}, [localParticipant, remoteParticipants, handPositions, reactions, onTogglePin, pinnedId, focusPinOf, requestFocus]);

	const audioParticipants = useMemo(() => remoteParticipants.map((p) => ({ id: p.id, audioStream: p.audioStream })), [remoteParticipants]);
	const activeSpeakerId = useActiveSpeakerId(audioParticipants, remoteParticipants[0]?.id ?? localParticipant.id);

	const [stageRef, stageSize] = useElementSize();
	const orientation = spotlightOrientation(stageSize);

	const pinnedTile = tiles.find(({ id }) => id === pinnedId);
	const { featured: featuredScreen, shares, pin: pinScreen, unpin: unpinScreen } = screens;
	const onStage = pinnedTile ? null : featuredScreen;

	const stageScreens = useMemo(
		() =>
			shares.map((share) => {
				const pinned = share.id === onStage?.id;
				const focusKey = `screen-${share.id}`;
				return {
					...share,
					pin: {
						pinned,
						restoreFocus: focusPinOf === focusKey,
						onToggle: (hadFocus: boolean) => {
							if (pinned) {
								unpinScreen();
							} else {
								pinScreen(share.id);
							}
							if (hadFocus) {
								requestFocus(focusKey);
							}
						},
					},
				};
			}),
		[shares, onStage, focusPinOf, pinScreen, unpinScreen, requestFocus],
	);
	const largeScreen = stageScreens.find(({ pin }) => pin.pinned);
	const otherScreens = stageScreens.filter(({ pin }) => !pin.pinned);

	const renderLayout = () => {
		if (pinnedTile && stageScreens.length > 0) {
			return (
				<ScreenShareLayout
					main={{ tile: pinnedTile }}
					screens={stageScreens}
					tiles={tiles}
					orientation={orientation}
					onStopLocalScreenShare={onStopLocalScreenShare}
				/>
			);
		}

		if (largeScreen) {
			return (
				<ScreenShareLayout
					main={{ screen: largeScreen }}
					screens={otherScreens}
					tiles={tiles}
					orientation={orientation}
					onStopLocalScreenShare={onStopLocalScreenShare}
				/>
			);
		}

		const featured = pinnedOrFeaturedTile(tiles, pinnedId, activeSpeakerId, localParticipant.id);
		// A pin wants someone large, which the grid has no place for: it lends the sidebar's arrangement while it lasts.
		const pinned = featured.id === pinnedId;

		if (layout === 'spotlight') {
			return <SpotlightLayout featured={featured} self={tiles.find((t) => t.id === localParticipant.id)} />;
		}

		if (layout === 'sidebar' || pinned) {
			return (
				<SidebarLayout
					featured={featured}
					tiles={tiles}
					activeSpeakerId={activeSpeakerId}
					selfId={localParticipant.id}
					stageSize={stageSize}
					orientation={orientation}
					screens={otherScreens}
				/>
			);
		}

		return <GridLayout tiles={tiles} activeSpeakerId={activeSpeakerId} selfId={localParticipant.id} screens={otherScreens} />;
	};

	return (
		<Box className={stageStyles} ref={stageRef}>
			{renderLayout()}
		</Box>
	);
};

export default CallStage;
