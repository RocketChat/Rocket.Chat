import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';

import type { SpotlightOrientation } from '../lib/stageTiles';

export const stageStyles = css`
	position: relative;
	display: flex;
	flex: 1 1 0;
	min-height: 0;
	padding-block: 0;
	padding-inline: 8px;
	gap: 8px;
	overflow: hidden;
`;

// Screen on top with thumbs in a row under it, or screen on the left with thumbs in a column beside it.
const spotlightStackedStyles = css`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
`;

const spotlightSideBySideStyles = css`
	display: flex;
	flex-direction: row;
	gap: 8px;
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
	gap: 8px;
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
	border-radius: 6px;
	overflow: hidden;
`;

const thumbStripStyles = css`
	display: flex;
	gap: 8px;
	height: 96px;
	flex-shrink: 0;
	overflow-x: auto;
	overflow-y: hidden;
	padding-block: 2px;
	scrollbar-width: thin;
`;

const thumbColumnStyles = css`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 200px;
	height: 100%;
	flex-shrink: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding-inline: 2px;
	scrollbar-width: thin;
`;

const thumbItemStyles = css`
	flex: 0 0 auto;
	width: 140px;
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
	width: 200px;
	height: 100%;
	border-radius: 6px;
	overflow: hidden;
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
	background-color: rgba(0, 0, 0, 0.45);
`;

export const stopShareButtonStyles = css`
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 1;
`;

export const ownBadgeStyles = css`
	position: absolute;
	left: 8px;
	bottom: 8px;
	padding: 2px 8px;
	border-radius: 4px;
	background-color: rgba(0, 0, 0, 0.55);
	color: white;
	font-size: 12px;
	line-height: 16px;
	pointer-events: none;
`;

export const spotlightSelfPipStyles = css`
	position: absolute;
	bottom: 16px;
	right: 16px;
	width: 180px;
	aspect-ratio: 16 / 9;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	z-index: 2;
`;

export const overflowTileStyles = css`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100%;
	border-radius: 6px;
	background-color: ${Palette.surface['surface-neutral'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;
