import { VisuallyHidden } from '@react-aria/visually-hidden';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { AriaAttributes } from 'react';
import { forwardRef, useId } from 'react';
import { useTranslation } from 'react-i18next';

import StreamVideo from './StreamVideo';
import type { ScreenZoom } from './screenZoom';
import { UNZOOMED, screenZoomTransform } from './screenZoom';

// Whatever holds it clips the zoomed screen, and would clip a focus ring drawn outside it too.
const viewportStyles = css`
	&[data-zoomed] {
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	&[data-zoomed]:active {
		cursor: grabbing;
	}

	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight'].toString()};
		outline-offset: -2px;
	}
`;

/** `aria-labelledby` points at whatever names the screen, such as a label shown over it. */
export type ZoomableScreenProps = {
	stream: MediaStream;
	zoom: ScreenZoom;
} & Required<Pick<AriaAttributes, 'aria-labelledby'>>;

/**
 * A shared screen filling its box, shown at `zoom`. Pass it the ref from `useScreenZoom` for the gestures that zoom
 * and move it; once zoomed it takes focus, for the arrow keys.
 */
const ZoomableScreen = forwardRef<HTMLDivElement, ZoomableScreenProps>(function ZoomableScreen(
	{ stream, zoom, 'aria-labelledby': labelledBy },
	ref,
) {
	const { t } = useTranslation();
	const hintId = useId();
	const zoomed = zoom.scale > UNZOOMED.scale;

	return (
		<Box
			ref={ref}
			className={viewportStyles}
			display='flex'
			width='full'
			height='full'
			role='group'
			aria-labelledby={labelledBy}
			aria-describedby={zoomed ? hintId : undefined}
			tabIndex={zoomed ? 0 : undefined}
			data-zoomed={zoomed || undefined}
		>
			<StreamVideo stream={stream} style={{ transform: screenZoomTransform(zoom) }} />
			{zoomed && <VisuallyHidden id={hintId}>{t('Screen_share_zoomed_hint')}</VisuallyHidden>}
		</Box>
	);
});

export default ZoomableScreen;
