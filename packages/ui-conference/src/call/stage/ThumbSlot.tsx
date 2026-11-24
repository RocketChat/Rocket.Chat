import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import type { SpotlightOrientation } from '../lib/stageTiles';
import { STRIP_SCREEN_WIDTH, STRIP_THUMB_WIDTH } from '../lib/stageTiles';

export type ThumbSlotProps = {
	orientation: SpotlightOrientation;
	screen?: boolean;
	children: ReactNode;
};

/** One thumbnail's place in the strip under the large view, or in the column beside it. */
const ThumbSlot = ({ orientation, screen = false, children }: ThumbSlotProps) =>
	orientation === 'side-by-side' ? (
		<Box flexShrink={0} width='full' style={{ aspectRatio: '16 / 9' }}>
			{children}
		</Box>
	) : (
		<Box flexShrink={0} width={screen ? STRIP_SCREEN_WIDTH : STRIP_THUMB_WIDTH} height='full'>
			{children}
		</Box>
	);

export default ThumbSlot;
