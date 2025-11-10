import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { FocusScope } from 'react-aria';

import VoipPopupDragHandle from './VoipPopupDragHandle';

export type PositionOffsets = Partial<{
	top: number;
	right: number;
	bottom: number;
	left: number;
}>;

type ContainerProps = {
	children: ReactNode;
	position?: PositionOffsets;
	dragHandleRef?: Ref<HTMLElement>;
	['data-testid']: string;
};

const Container = styled('article', ({ position: _position, ...props }: Pick<ContainerProps, 'position'>) => props)`
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
	box-shadow:
		0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
	background-color: ${Palette.surface['surface-tint'].toString()};
	z-index: 100;
`;

const VoipPopupContainer = forwardRef<HTMLDivElement, ContainerProps>(function VoipPopupContainer(
	{ children, position = { top: 0, left: 0 }, dragHandleRef, ...props },
	ref,
) {
	return (
		<FocusScope autoFocus restoreFocus>
			<Container ref={ref} aria-labelledby='voipPopupTitle' position={position} {...props}>
				<VoipPopupDragHandle ref={dragHandleRef} />
				{children}
			</Container>
		</FocusScope>
	);
});

export default VoipPopupContainer;
