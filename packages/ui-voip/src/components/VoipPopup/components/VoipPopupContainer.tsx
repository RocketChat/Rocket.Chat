import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';
import { FocusScope } from 'react-aria';

export type PositionOffsets = Partial<{
	top: number;
	right: number;
	bottom: number;
	left: number;
}>;

type ContainerProps = {
	children: ReactNode;
	secondary?: boolean;
	position?: PositionOffsets;
	['data-testid']: string;
};

const Container = styled(
	'article',
	({ secondary: _secondary, position: _position, ...props }: Pick<ContainerProps, 'secondary' | 'position'>) => props,
)`
	position: fixed;
	top: ${(p) => (p.position?.top !== undefined ? `${p.position.top}px` : 'initial')};
	right: ${(p) => (p.position?.right !== undefined ? `${p.position.right}px` : 'initial')};
	bottom: ${(p) => (p.position?.bottom !== undefined ? `${p.position.bottom}px` : 'initial')};
	left: ${(p) => (p.position?.left !== undefined ? `${p.position.left}px` : 'initial')};
	display: flex;
	flex-direction: column;
	width: 250px;
	min-height: 128px;
	border-radius: 4px;
	border: 1px solid ${Palette.stroke['stroke-dark'].toString()};
	box-shadow: 0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
	background-color: ${(p) => (p.secondary ? Palette.surface['surface-neutral'].toString() : Palette.surface['surface-light'].toString())};
	z-index: 100;
`;

const VoipPopupContainer = ({ children, secondary = false, position = { top: 0, left: 0 }, ...props }: ContainerProps) => (
	<FocusScope autoFocus restoreFocus>
		<Container aria-labelledby='voipPopupTitle' secondary={secondary} position={position} {...props}>
			{children}
		</Container>
	</FocusScope>
);

export default VoipPopupContainer;
