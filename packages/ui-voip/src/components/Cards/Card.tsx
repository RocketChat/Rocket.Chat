import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const styles = css`
	box-shadow:
		0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};

	&:hover .rcx-card-slot--onHover {
		display: flex;
	}
`;

export const CARD_HEIGHT = 180;

export const CARD_MIN_WIDTH = CARD_HEIGHT;
const CARD_MAX_WIDTH = 320;

export const CARD_MARGIN = 2;

export const CARD_TOTAL_HEIGHT = CARD_HEIGHT + CARD_MARGIN * 2;
export const CARD_TOTAL_WIDTH = CARD_MAX_WIDTH + CARD_MARGIN * 2;

type CardProps = {
	children: ReactNode;
	title?: string;
	maxWidth?: string | number;
	maxHeight?: string | number;
	width?: string | number;
	height?: string | number;
	flexGrow?: number;
	flexShrink?: number;
	minHeight?: number;
	variant?: 'highlighted' | 'default';
};

const highlightedBorderProps = {
	border: '4px solid',
	borderColor: 'stroke-extra-light-error',
} as const;

const defaultBorderProps = {
	border: '1px solid',
	borderColor: 'stroke-medium',
} as const;

const Card = ({
	children,
	title,
	maxWidth = CARD_MAX_WIDTH, // 4:3
	maxHeight = CARD_HEIGHT, // 4:3
	minHeight = CARD_HEIGHT,
	width,
	height = CARD_HEIGHT,
	flexGrow = 0,
	flexShrink = 1,
	variant = 'default',
}: CardProps) => {
	const borderProps = variant === 'highlighted' ? highlightedBorderProps : defaultBorderProps;
	return (
		<Box
			position='relative'
			display='flex'
			flexGrow={flexGrow}
			flexShrink={flexShrink}
			overflow='hidden'
			alignItems='center'
			title={title}
			borderRadius='4px'
			className={styles}
			backgroundColor='surface-light'
			maxHeight={maxHeight}
			maxWidth={maxWidth}
			width={width}
			height={height}
			minWidth={CARD_MIN_WIDTH}
			minHeight={minHeight}
			m={CARD_MARGIN}
			{...borderProps}
		>
			{children}
		</Box>
	);
};

export default Card;
