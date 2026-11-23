import { VisuallyHidden } from '@react-aria/visually-hidden';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useMergedRefsV2 } from '@rocket.chat/ui-client';
import type { AriaAttributes } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import StreamVideo from './StreamVideo.js';
import type { ScreenZoom, ScreenZoomChange } from './screenZoom.js';
import { UNZOOMED, confineTo, screenZoomTransform } from './screenZoom.js';
import { usePictureExtent } from './usePictureExtent.js';
import { useScreenZoomGestures } from './useScreenZoomGestures.js';

const viewportStyles = css`
	position: relative;
	display: flex;
	width: 100%;
	height: 100%;

	&[data-zoomed] {
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	&[data-zoomed]:active {
		cursor: grabbing;
	}

	/* Inside the box: whatever holds the viewer clips the zoomed screen, and would clip a ring drawn around it. */
	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight'].toString()};
		outline-offset: -2px;
	}

	/* A second ring in the surface colour, so one of the two stands out whatever the screen is showing. */
	&:focus-visible::after {
		position: absolute;
		inset: 0;
		box-shadow: inset 0 0 0 4px ${Palette.surface['surface-light'].toString()};
		content: '';
		pointer-events: none;
	}
`;

export type ZoomableScreenProps = {
	stream: MediaStream;
	zoom: ScreenZoom;
	onZoomChange: (change: ScreenZoomChange) => void;
} & Required<Pick<AriaAttributes, 'aria-labelledby'>>;

/**
 * A shared screen filling its box, shown at `zoom`. Ctrl+wheel and trackpad pinches zoom it around the pointer; once
 * zoomed it takes keyboard focus, and dragging or the arrow keys move around it.
 */
const ZoomableScreen = ({ stream, zoom, onZoomChange, 'aria-labelledby': labelledBy }: ZoomableScreenProps) => {
	const { t } = useTranslation();
	const hintId = useId();
	const [extentRef, extent] = usePictureExtent();
	const shown = confineTo(zoom, extent);
	const zoomed = shown.scale > UNZOOMED.scale;
	const gesturesRef = useScreenZoomGestures({ zoomed, extent, onZoomChange });
	const ref = useMergedRefsV2(extentRef, gesturesRef);

	return (
		<Box
			ref={ref}
			className={viewportStyles}
			role='group'
			aria-labelledby={labelledBy}
			aria-describedby={zoomed ? hintId : undefined}
			tabIndex={zoomed ? 0 : -1}
			data-zoomed={zoomed || undefined}
		>
			<StreamVideo stream={stream} style={{ transform: screenZoomTransform(shown) }} />
			<span id={hintId} hidden>
				{t('Screen_share_zoomed_hint')}
			</span>
			<VisuallyHidden role='status'>{t('Zoom_level_percent', { percent: Math.round(shown.scale * 100) })}</VisuallyHidden>
		</Box>
	);
};

export default ZoomableScreen;
