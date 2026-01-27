import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import CardSlotContainer, { type SlotPosition } from './CardSlotContainer';
import CardSlotContainerInner from './CardSlotContainerInner';

const boxShadow = css`
	box-shadow:
		0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
`;

export const CARD_HEIGHT = 180;

const CARD_MIN_WIDTH = CARD_HEIGHT;
const CARD_MAX_WIDTH = 320;

const CARD_MARGIN = 2;

export const CARD_TOTAL_HEIGHT = CARD_HEIGHT + CARD_MARGIN * 2;
export const CARD_TOTAL_WIDTH = CARD_MAX_WIDTH + CARD_MARGIN * 2;

export type GenericCardSlots = { [key in SlotPosition]?: ReactNode };

type GenericCardProps = {
	children: ReactNode;
	title?: string;
	slots?: GenericCardSlots;
	maxWidth?: string | number;
	maxHeight?: string | number;
	width?: string | number;
	height?: string | number;
	flexGrow?: number;
	flexShrink?: number;
};

const GenericCard = ({
	children,
	slots,
	title,
	maxWidth = CARD_MAX_WIDTH, // 4:3
	maxHeight = CARD_HEIGHT, // 4:3
	width,
	height = CARD_HEIGHT,
	flexGrow = 0,
	flexShrink = 1,
}: GenericCardProps) => {
	return (
		<Box
			position='relative'
			display='flex'
			flexGrow={flexGrow}
			flexShrink={flexShrink}
			overflow='hidden'
			alignItems='center'
			title={title}
			border='1px solid'
			borderRadius='8px'
			borderColor='stroke-light'
			className={boxShadow}
			backgroundColor='surface-light'
			maxHeight={maxHeight}
			maxWidth={maxWidth}
			width={width}
			height={height}
			minWidth={CARD_MIN_WIDTH}
			minHeight={CARD_HEIGHT}
			m={CARD_MARGIN}
		>
			{children}
			{/* TODO: Maybe the slots should be used as components instead of props */}
			{slots &&
				Object.entries(slots).map(([position, child]) => {
					if (!child) {
						return null;
					}
					return (
						<CardSlotContainer key={position} position={position as SlotPosition}>
							<CardSlotContainerInner />
							<Box is='span' zIndex='3'>
								{child}
							</Box>
						</CardSlotContainer>
					);
				})}
		</Box>
	);
};

export default GenericCard;
