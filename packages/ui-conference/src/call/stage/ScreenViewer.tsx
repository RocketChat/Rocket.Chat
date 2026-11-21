import { VisuallyHidden } from '@react-aria/visually-hidden';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { ActionButton, StreamVideo, ToggleButton } from '@rocket.chat/ui-media';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { mainStreamStyles, ownBadgeStyles, screenZoomViewportStyles } from './stageStyles';
import { useFullscreen } from '../hooks/useFullscreen';
import { useScreenZoom } from '../hooks/useScreenZoom';
import { MAX_ZOOM_SCALE, UNZOOMED, screenZoomTransform } from '../lib/screenZoom';

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
	const { t } = useTranslation();
	const labelId = useId();
	const hintId = useId();
	const [fullscreenRef, fullscreen] = useFullscreen();
	const [zoomRef, zoom, { zoomIn, zoomOut }] = useScreenZoom();
	const zoomed = zoom.scale > UNZOOMED.scale;

	return (
		<Box className={mainStreamStyles} ref={fullscreenRef}>
			<Box
				ref={zoomRef}
				className={screenZoomViewportStyles}
				display='flex'
				width='full'
				height='full'
				role='group'
				aria-labelledby={labelId}
				aria-describedby={zoomed ? hintId : undefined}
				tabIndex={zoomed ? 0 : undefined}
				data-zoomed={zoomed || undefined}
			>
				<StreamVideo stream={stream} style={{ transform: screenZoomTransform(zoom) }} />
			</Box>
			{zoomed && <VisuallyHidden id={hintId}>{t('Screen_share_zoomed_hint')}</VisuallyHidden>}
			<Box id={labelId} className={ownBadgeStyles} fontScale='c1'>
				{label}
			</Box>
			<Box position='absolute' insetBlockEnd={8} insetInlineEnd={8} zIndex={1}>
				<ButtonGroup>
					<ActionButton icon='h-bar' label={t('Zoom_out')} disabled={!zoomed} onClick={zoomOut} />
					<ActionButton icon='plus' label={t('Zoom_in')} disabled={zoom.scale >= MAX_ZOOM_SCALE} onClick={zoomIn} />
					{fullscreen.available && (
						<ToggleButton
							label={t('Fullscreen')}
							titles={[t('Fullscreen'), t('Exit_fullscreen')]}
							icons={['square-arrows-contained-outwards', 'square-arrows-contained-inwards']}
							pressed={fullscreen.fullscreen}
							aria-pressed={fullscreen.fullscreen}
							danger={false}
							onToggle={fullscreen.toggle}
						/>
					)}
				</ButtonGroup>
			</Box>
			{children}
		</Box>
	);
};

export default ScreenViewer;
