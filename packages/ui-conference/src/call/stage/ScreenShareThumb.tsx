import { Box } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';

import ScreenActions from './ScreenActions';
import { ownBadgeStyles, screenThumbStyles } from './stageStyles';
import ScreenPin from '../ScreenPin';
import { useScreenShareLabel } from '../hooks/useScreenShareLabel';
import type { ScreenShare } from '../lib/screenShares';

export type ScreenShareThumbProps = {
	share: ScreenShare;
};

/** A screen shared while it is not on the stage, offering, on hover or focus, to pin it there. */
const ScreenShareThumb = ({ share }: ScreenShareThumbProps) => {
	const label = useScreenShareLabel(share);

	return (
		<Box className={screenThumbStyles}>
			<StreamVideo stream={share.stream} fit='contain' />
			<Box className={ownBadgeStyles} fontScale='c1'>
				{label}
			</Box>
			<ScreenActions compact className='rcx-screen-thumb-overlay'>
				<ScreenPin share={share} />
			</ScreenActions>
		</Box>
	);
};

export default ScreenShareThumb;
