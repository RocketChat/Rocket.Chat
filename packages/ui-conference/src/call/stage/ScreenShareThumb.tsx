import { Box } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';

import { ownBadgeStyles, screenThumbActionsStyles, screenThumbFillStyles, screenThumbStyles } from './stageStyles';
import PinToggle from '../PinToggle';
import { useScreenShareLabels } from '../hooks/useScreenShareLabels';
import type { StageScreen } from '../lib/screenShares';

export type ScreenShareThumbProps = {
	screen: StageScreen;
	/** Fills a grid cell instead of taking a thumbnail's size. */
	fill?: boolean;
};

/** A screen shared while it is not on the stage, offering, on hover or focus, to pin it there. */
const ScreenShareThumb = ({ screen, fill = false }: ScreenShareThumbProps) => {
	const { labelOf, pinLabelOf } = useScreenShareLabels();

	return (
		<Box className={[screenThumbStyles, fill ? screenThumbFillStyles : null]}>
			<StreamVideo stream={screen.stream} fit='contain' />
			<Box className={ownBadgeStyles} fontScale='c1'>
				{labelOf(screen)}
			</Box>
			<Box className={['rcx-screen-thumb-overlay', screenThumbActionsStyles]}>
				<PinToggle
					size='small'
					variant='secondary'
					pinned={false}
					label={pinLabelOf(screen, false)}
					restoreFocus={screen.pin.restoreFocus}
					onPinToggle={screen.pin.onToggle}
				/>
			</Box>
		</Box>
	);
};

export default ScreenShareThumb;
