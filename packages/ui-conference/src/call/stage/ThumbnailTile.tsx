import type { StageTile } from '../lib/stageTiles.js';
import ParticipantThumbnail from '../tile/ParticipantThumbnail.js';
import SelfThumbnail from '../tile/SelfThumbnail.js';

export type ThumbnailTileProps = {
	tile: StageTile;
};

/** A stage tile as a thumbnail, beside or under the large view. */
const ThumbnailTile = ({ tile }: ThumbnailTileProps) =>
	tile.kind === 'self' ? (
		<SelfThumbnail
			displayName={tile.displayName}
			avatarUrl={tile.avatarUrl}
			muted={tile.muted}
			held={tile.held}
			cameraStream={tile.cameraStream}
			audioStream={tile.audioStream}
			handPosition={tile.handPosition}
			reaction={tile.reaction}
			sendHeight={tile.sendHeight}
		/>
	) : (
		<ParticipantThumbnail
			displayName={tile.displayName}
			avatarUrl={tile.avatarUrl}
			muted={tile.muted}
			held={tile.held}
			cameraStream={tile.cameraStream}
			audioStream={tile.audioStream}
			handPosition={tile.handPosition}
			reaction={tile.reaction}
		/>
	);

export default ThumbnailTile;
