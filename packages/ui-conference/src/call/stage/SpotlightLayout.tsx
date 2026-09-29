import { Box } from '@rocket.chat/fuselage';

import { mainStreamStyles, spotlightSelfPipStyles } from './stageStyles';
import CallTile from '../CallTile';
import type { StageTile } from '../lib/stageTiles';

export type SpotlightLayoutProps = {
	featured: StageTile;
	self: StageTile | undefined;
};

/** The speaker fills the stage, and the reader's own view floats in the corner. */
const SpotlightLayout = ({ featured, self }: SpotlightLayoutProps) => (
	<Box display='flex' width='full' height='full' position='relative'>
		<Box className={mainStreamStyles}>
			<CallTile {...featured} />
		</Box>
		{self && self.id !== featured.id && (
			<Box className={spotlightSelfPipStyles}>
				<CallTile {...self} compact />
			</Box>
		)}
	</Box>
);

export default SpotlightLayout;
