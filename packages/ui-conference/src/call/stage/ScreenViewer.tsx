import { Box } from '@rocket.chat/fuselage';
import { usePlayMediaStream } from '@rocket.chat/ui-voip';

import { mainStreamStyles, ownBadgeStyles } from './stageStyles';

export type ScreenViewerProps = {
	stream: MediaStream;
	label: string;
};

/** A shared screen, letterboxed in the room it is given. Muted: the screen's own audio, if any, plays with the rest of the call. */
const ScreenViewer = ({ stream, label }: ScreenViewerProps) => {
	const [videoRef] = usePlayMediaStream(stream);
	return (
		<Box className={mainStreamStyles}>
			<video ref={videoRef} preload='metadata' muted style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
				<track kind='captions' />
			</video>
			<Box className={ownBadgeStyles} fontScale='c1'>
				{label}
			</Box>
		</Box>
	);
};

export default ScreenViewer;
