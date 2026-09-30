import { Box } from '@rocket.chat/fuselage';
import { usePlayMediaStream } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';

import { mainStreamStyles, ownBadgeStyles } from './stageStyles';

export type ScreenViewerProps = {
	stream: MediaStream;
	label: string;
	/** Controls over the screen, for whoever may act on it. */
	children?: ReactNode;
};

/** A shared screen at the size of the stage. Muted: the screen's own audio, if any, plays with the rest of the call. */
const ScreenViewer = ({ stream, label, children }: ScreenViewerProps) => {
	const [videoRef] = usePlayMediaStream(stream);
	return (
		<Box className={mainStreamStyles}>
			<video ref={videoRef} playsInline preload='metadata' muted style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
				<track kind='captions' />
			</video>
			<Box className={ownBadgeStyles} fontScale='c1'>
				{label}
			</Box>
			{children}
		</Box>
	);
};

export default ScreenViewer;
