import { css } from '@rocket.chat/css-in-js';
import { Palette, borderRadius } from '@rocket.chat/fuselage';

import type { SpotlightOrientation } from '../lib/stageTiles';
import { COLUMN_THUMB_WIDTH, STRIP_THUMB_WIDTH } from '../lib/stageTiles';
import { TILE_GAP_PX } from '../lib/tileGrid';

export const stageStyles = css`
	position: relative;
	display: flex;
	flex: 1 1 0;
	min-height: 0;
	padding-block: 0;
	padding-inline: 0.5rem;
	gap: 0.5rem;
	overflow: hidden;
`;

// Screen on top with thumbs in a row under it, or screen on the left with thumbs in a column beside it.
const spotlightStackedStyles = css`
	display: flex;
	flex-direction: column;
	gap: ${TILE_GAP_PX}px;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
`;

const spotlightSideBySideStyles = css`
	display: flex;
	flex-direction: row;
	gap: ${TILE_GAP_PX}px;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
`;

// Fills the stage whatever size the grid inside ends up, so the size it reports never shrinks with the grid.
export const gridMeasureStyles = css`
	flex: 1 1 0;
	min-width: 0;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
`;

// Cell sizes come inline from the grid layout; clamped cells leave the grid smaller than its wrapper, centred in it.
export const gridStyles = css`
	display: grid;
	gap: ${TILE_GAP_PX}px;
`;

// Grows into whatever the thumbs leave: without the zero minimums flexbox would not shrink it on a short stage,
// and the screen would sit letterboxed in a viewer too small for it.
export const mainStreamStyles = css`
	position: relative;
	display: flex;
	flex: 1 1 0;
	min-width: 0;
	min-height: 0;
	align-items: center;
	justify-content: center;
	background-color: ${Palette.surface['surface-neutral'].toString()};
	border-radius: ${borderRadius('large')};
	overflow: hidden;
`;

const thumbStripStyles = css`
	display: flex;
	gap: ${TILE_GAP_PX}px;
	height: 6rem;
	flex-shrink: 0;
	overflow-x: auto;
	overflow-y: hidden;
	padding-block: 0.125rem;
	scrollbar-width: thin;
`;

const thumbColumnStyles = css`
	display: flex;
	flex-direction: column;
	gap: ${TILE_GAP_PX}px;
	width: ${COLUMN_THUMB_WIDTH}px;
	height: 100%;
	flex-shrink: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding-inline: 0.125rem;
	scrollbar-width: thin;
`;

const thumbItemStyles = css`
	flex: 0 0 auto;
	width: ${STRIP_THUMB_WIDTH}px;
	height: 100%;
`;

// In a column each thumb takes its width and gets its height from the aspect ratio, however tall the column is.
const thumbItemColumnStyles = css`
	flex: 0 0 auto;
	width: 100%;
	aspect-ratio: 16 / 9;
`;

/** The classes for a spotlight arrangement in either orientation. */
export const spotlightClasses = (orientation: SpotlightOrientation) =>
	orientation === 'side-by-side'
		? { container: spotlightSideBySideStyles, thumbs: thumbColumnStyles, thumb: thumbItemColumnStyles, thumbOrientation: 'column' }
		: { container: spotlightStackedStyles, thumbs: thumbStripStyles, thumb: thumbItemStyles, thumbOrientation: 'row' };

// Wider than a participant thumb so the screen is legible. In a column, the column sets the width and the aspect
// ratio the height.
export const screenThumbStyles = css`
	position: relative;
	flex: 0 0 auto;
	width: 12.5rem;
	height: 100%;
	border-radius: ${borderRadius('large')};
	overflow: hidden;
	/* Fixed, not themed: the letterbox around a video frame is black in every theme. */
	background-color: black;
	border: 1px solid ${Palette.stroke['stroke-medium'].toString()};

	[data-thumb-orientation='column'] & {
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
	}

	& .rcx-screen-thumb-overlay {
		opacity: 0;
		pointer-events: none;
		transition: opacity 150ms ease;
	}
	&:hover .rcx-screen-thumb-overlay {
		opacity: 1;
		pointer-events: auto;
	}
	&:focus-within .rcx-screen-thumb-overlay {
		opacity: 1;
		pointer-events: auto;
	}
`;

export const spotlightOverlayStyles = css`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${Palette.surface['surface-overlay'].toString()};
`;

export const stopShareButtonStyles = css`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	z-index: 1;
`;

export const ownBadgeStyles = css`
	position: absolute;
	left: 0.5rem;
	bottom: 0.5rem;
	padding: 0.25rem 0.5rem;
	border-radius: ${borderRadius('medium')};
	background-color: ${Palette.surface['surface-overlay'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
	pointer-events: none;
`;

export const spotlightSelfPipStyles = css`
	position: absolute;
	bottom: 1rem;
	right: 1rem;
	width: 11.25rem;
	aspect-ratio: 16 / 9;
	border-radius: ${borderRadius('large')};
	overflow: hidden;
	/* Fixed, not themed: it lifts the picture-in-picture off camera frames, which are the same colours in every theme. */
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	z-index: 2;
`;

export const overflowTileStyles = css`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	height: 100%;
	border-radius: ${borderRadius('large')};
	background-color: ${Palette.surface['surface-neutral'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;
