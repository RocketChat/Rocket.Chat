import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';

export type SlotPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type CardSlotContainerProps = {
	position: SlotPosition;
	children: ReactNode;
};

const slotPositionStyles = {
	topLeft: 'top: 0; left: 0;',
	topRight: 'top: 0; right: 0;',
	bottomLeft: 'bottom: 0; left: 0;',
	bottomRight: 'bottom: 0; right: 0;',
};

const CardSlotContainer = styled('div', ({ position: _position, ...props }: CardSlotContainerProps) => props)`
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

export default CardSlotContainer;
