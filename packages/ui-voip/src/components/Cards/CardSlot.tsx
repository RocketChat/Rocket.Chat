import { Box, Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';

const slotPositionStyles = {
	topLeft: 'top: 0; left: 0;',
	topRight: 'top: 0; right: 0;',
	bottomLeft: 'bottom: 0; left: 0;',
	bottomRight: 'bottom: 0; right: 0;',
	middle: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
};

export type SlotPosition = keyof typeof slotPositionStyles;

export type CardSlotProps = {
	position: SlotPosition;
	margin?: number;
	children: ReactNode;
	variant?: 'default' | 'transparent';
	showOnHover?: boolean;
};

const CardSlotBase = styled(
	'div',
	({ position: _position, margin: _margin, variant: _variant, showOnHover: _showOnHover, ...props }: CardSlotProps) => props,
)`
	position: absolute;
	display: ${({ showOnHover }) => (showOnHover ? 'none' : 'flex')};
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin: ${({ margin }) => (typeof margin === 'number' ? `${margin}px` : '4px')};
	height: 24px;
	min-width: 24px;
	padding-inline: 8px;
	${({ position }) => slotPositionStyles[position]}
	border-radius: 4px;
	${({ variant }) => (variant === 'default' ? `background-color: ${Palette.surface['surface-tint'].toString()};` : '')}
	color: ${Palette.text['font-default'].toString()};
	overflow: hidden;
	z-index: 3;
`;

const CardSlot = ({ children, position, margin, variant = 'default', showOnHover = false }: CardSlotProps) => {
	return (
		<CardSlotBase
			position={position}
			margin={margin}
			variant={variant}
			showOnHover={showOnHover}
			className={showOnHover ? 'rcx-card-slot--onHover' : undefined}
		>
			<Box is='span' fontScale='c2'>
				{children}
			</Box>
		</CardSlotBase>
	);
};

export default CardSlot;
