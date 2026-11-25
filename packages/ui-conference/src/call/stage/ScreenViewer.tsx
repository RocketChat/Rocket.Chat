import { FocusScope } from '@react-aria/focus';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { FullscreenButton, ScreenZoomButtons, ZoomableScreen, useFullscreenToggle, useScreenZoom } from '@rocket.chat/ui-media';
import type { ReactNode } from 'react';
import { useId } from 'react';

import { mainStreamStyles, screenControlsStyles, screenLabelStyles, screenOverlayBarStyles } from './stageStyles.js';

export type ScreenViewerProps = {
	stream: MediaStream;
	label: string;
	/** Controls over the screen, for whoever may act on it. */
	children?: ReactNode;
};

/**
 * A shared screen at the size of the stage, to zoom into and show fullscreen. Muted: the screen's own audio, if any,
 * plays with the rest of the call.
 */
const ScreenViewer = ({ stream, label, children }: ScreenViewerProps) => {
	const labelId = useId();
	const { fullscreen, enabled: fullscreenEnabled, toggleFullscreen, targetRef } = useFullscreenToggle();
	const { zoom, changeZoom, zoomIn, zoomOut, canZoomIn, canZoomOut } = useScreenZoom(stream.id);

	return (
		<Box className={mainStreamStyles} ref={targetRef}>
			{/* Fullscreen hides the rest of the call without taking it out of the tab order. */}
			<FocusScope contain={fullscreen}>
				<ZoomableScreen stream={stream} zoom={zoom} onZoomChange={changeZoom} aria-labelledby={labelId} />
				<Box className={screenOverlayBarStyles}>
					<Box id={labelId} className={screenLabelStyles} fontScale='c1'>
						{label}
					</Box>
					<Box className={screenControlsStyles}>
						<ButtonGroup>
							<ScreenZoomButtons canZoomIn={canZoomIn} canZoomOut={canZoomOut} onZoomIn={zoomIn} onZoomOut={zoomOut} />
							{fullscreenEnabled && <FullscreenButton fullscreen={fullscreen} onToggle={toggleFullscreen} />}
						</ButtonGroup>
					</Box>
				</Box>
				{children}
			</FocusScope>
		</Box>
	);
};

export default ScreenViewer;
