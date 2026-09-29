import { Box, IconButton } from '@rocket.chat/fuselage';
import { usePlayMediaStream } from '@rocket.chat/ui-voip';

import { mainStreamStyles, ownBadgeStyles, stopShareButtonStyles } from './stageStyles';

export type ScreenViewerProps = {
	stream: MediaStream;
	label: string;
	isLocal?: boolean;
	onStop?: () => void;
};

/** A shared screen at the size of the stage. */
const ScreenViewer = ({ stream, label, isLocal, onStop }: ScreenViewerProps) => {
	const [videoRef] = usePlayMediaStream(stream);
	return (
		<Box className={mainStreamStyles}>
			<video ref={videoRef} preload='metadata' muted={isLocal} style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
				<track kind='captions' />
			</video>
			<Box className={ownBadgeStyles}>{label}</Box>
			{isLocal && onStop && (
				<Box className={stopShareButtonStyles}>
					<IconButton icon='cross' small secondary onClick={onStop} title='Stop sharing' />
				</Box>
			)}
		</Box>
	);
};

export default ScreenViewer;
