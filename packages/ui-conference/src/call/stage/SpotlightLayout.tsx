import { Box } from '@rocket.chat/fuselage';

import MainTile from './MainTile.js';
import ThumbnailTile from './ThumbnailTile.js';
import { mainStreamStyles, spotlightSelfPipStyles } from './stageStyles.js';
import type { StageTile } from '../lib/stageTiles.js';

export type SpotlightLayoutProps = {
	featured: StageTile;
	self: StageTile | undefined;
};

/** The speaker fills the stage, and the reader's own view floats in the corner. */
const SpotlightLayout = ({ featured, self }: SpotlightLayoutProps) => (
	<Box display='flex' width='full' height='full' position='relative'>
		<Box className={mainStreamStyles}>
			<MainTile tile={featured} />
		</Box>
		{self && self.id !== featured.id && (
			<Box className={spotlightSelfPipStyles}>
				<ThumbnailTile tile={self} />
			</Box>
		)}
	</Box>
);

export default SpotlightLayout;
