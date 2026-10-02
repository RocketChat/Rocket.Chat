import { css } from '@rocket.chat/css-in-js';
import { Palette, borderRadius } from '@rocket.chat/fuselage';

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

// Grows into whatever room its container has: without the zero minimums flexbox would not shrink it in a small
// cell, and the screen would spill out of it.
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
