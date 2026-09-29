import type { StageTile } from '../lib/stageTiles';
import ParticipantTile from '../tile/ParticipantTile';
import SelfTile from '../tile/SelfTile';

export type MainTileProps = {
	tile: StageTile;
};

/** A stage tile at full size: a grid cell, or the large view. */
const MainTile = ({ tile }: MainTileProps) =>
	tile.kind === 'self' ? (
		<SelfTile
			displayName={tile.displayName}
			avatarUrl={tile.avatarUrl}
			muted={tile.muted}
			held={tile.held}
			cameraStream={tile.cameraStream}
			audioStream={tile.audioStream}
			sendHeight={tile.sendHeight}
		/>
	) : (
		<ParticipantTile
			displayName={tile.displayName}
			avatarUrl={tile.avatarUrl}
			muted={tile.muted}
			held={tile.held}
			cameraStream={tile.cameraStream}
			audioStream={tile.audioStream}
		/>
	);

export default MainTile;
