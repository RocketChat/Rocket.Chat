import { Box, Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';

const slotPositionStyles = {
	topLeft: 'top: 0; left: 0;',
	topRight: 'top: 0; right: 0;',
	bottomLeft: 'bottom: 0; left: 0;',
	bottomRight: 'bottom: 0; right: 0;',
};

export type SlotPosition = keyof typeof slotPositionStyles;

export type CardSlotContainerProps = {
	position: SlotPosition;
	margin?: number;
	children: ReactNode;
};

const CardSlotContainerBase = styled('div', ({ position: _position, margin: _margin, ...props }: CardSlotContainerProps) => props)`
	position: absolute;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin: ${({ margin }) => (margin ? `${margin}px` : '4px')};
	height: 24px;
	min-width: 24px;
	padding-inline: 8px;
	${({ position }) => slotPositionStyles[position]}
	border-radius: 4px;
	background-color: ${Palette.surface['surface-tint'].toString()};
	color: ${Palette.text['font-default'].toString()};
	overflow: hidden;
	z-index: 1;
`;

const CardSlotContainer = ({ children, position, margin }: CardSlotContainerProps) => {
	return (
		<CardSlotContainerBase position={position} margin={margin}>
			<Box is='span' fontScale='c2'>
				{children}
			</Box>
		</CardSlotContainerBase>
	);
};

export default CardSlotContainer;
