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
	children: ReactNode;
};

const CardSlotContainerBase = styled('div', ({ position: _position, ...props }: CardSlotContainerProps) => props)`
	position: absolute;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin: 4px;
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

const CardSlotContainer = ({ children, position }: CardSlotContainerProps) => {
	return (
		<CardSlotContainerBase position={position}>
			<Box is='span' fontScale='c2'>
				{children}
			</Box>
		</CardSlotContainerBase>
	);
};

export default CardSlotContainer;
