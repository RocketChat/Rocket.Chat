import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';

const CARD_HEIGHT = 180;

const CARD_MIN_WIDTH = CARD_HEIGHT;
const CARD_MAX_WIDTH = 320;

const CARD_MARGIN = 2;

export const CARD_TOTAL_HEIGHT = CARD_HEIGHT + CARD_MARGIN * 2;
export const CARD_TOTAL_WIDTH = CARD_MAX_WIDTH + CARD_MARGIN * 2;

export type GenericCardSlots = {
	topLeft?: ReactNode;
	topRight?: ReactNode;
	bottomLeft?: ReactNode;
	bottomRight?: ReactNode;
};

type GenericCardProps = {
	children: ReactNode;
	title: string;
	slots?: GenericCardSlots;
	maxWidth?: string | number;
	maxHeight?: string | number;
	width?: string | number;
	height?: string | number;
	flexGrow?: number;
	flexShrink?: number;
};

type SlotPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type SlotContainerProps = {
	position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
	children: ReactNode;
};

const slotPositionStyles = {
	topLeft: 'top: 0; left: 0;',
	topRight: 'top: 0; right: 0;',
	bottomLeft: 'bottom: 0; left: 0;',
	bottomRight: 'bottom: 0; right: 0;',
};

const SlotContainer = styled('div', ({ position: _position, ...props }: SlotContainerProps) => props)`
	position: absolute;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding-block: 4px;
	padding-inline: 8px;
	margin: 8px;
	${({ position }) => slotPositionStyles[position]}
	border-radius: 8px;
	color: ${Palette.text['font-default'].toString()};
	overflow: hidden;
	z-index: 1;
`;

const SlotContainerInner = styled('span')`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	opacity: 0.7;
	background-color: ${Palette.surface['surface-hover'].toString()};
	color: ${Palette.text['font-default'].toString()};
	z-index: 2;
`;

const boxShadow = css`
	box-shadow:
		0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
`;

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
	console.log({
		flexGrow,
		flexShrink,
		maxWidth,
		maxHeight,
		width,
		height,
	});
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
						<SlotContainer key={position} position={position as SlotPosition}>
							<SlotContainerInner />
							<Box is='span' zIndex='3'>
								{child}
							</Box>
						</SlotContainer>
					);
				})}
		</Box>
	);
};

export default GenericCard;
