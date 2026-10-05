import { Box } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';

import { mainStreamStyles, ownBadgeStyles } from './stageStyles';

export type ScreenViewerProps = {
	stream: MediaStream;
	label: string;
};

/** A shared screen, letterboxed in the room it is given. Muted: the screen's own audio, if any, plays with the rest of the call. */
const ScreenViewer = ({ stream, label }: ScreenViewerProps) => {
	return (
		<Box className={mainStreamStyles}>
			<StreamVideo stream={stream} />
			<Box className={ownBadgeStyles} fontScale='c1'>
				{label}
			</Box>
		</Box>
	);
};

export default ScreenViewer;
