import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import { ComponentProps, useLayoutEffect } from 'react';

import { DragContext } from './WidgetDraggableContext';
import { useDraggable } from '../../../components/VoipPopupDraggable/DraggableCore';

// TODO: Initial position from the draggable api instead of style props
// TODO: A11Y
const WidgetBase = styled('article')`
	position: fixed;
	right: 2em;
	bottom: 10em;
	display: flex;
	flex-direction: column;
	width: 248px;
	min-height: 128px;
	border-radius: 4px;
	border: 1px solid ${Palette.stroke['stroke-dark'].toString()};
	box-shadow:
		0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
	background-color: ${Palette.surface['surface-tint'].toString()};
	color: ${Palette.text['font-default'].toString()};
	z-index: 100;
	overflow: hidden;
`;

type WidgetProps = {
	children: React.ReactNode;
} & ComponentProps<typeof WidgetBase>;

const Widget = ({ children, ...props }: WidgetProps) => {
	const [draggableRef, boundingRef, handleRef] = useDraggable();

	useLayoutEffect(() => {
		boundingRef(document.body);
	}, [boundingRef]);

	return (
		<DragContext.Provider value={{ draggableRef, boundingRef, handleRef }}>
			<WidgetBase {...props} ref={draggableRef}>
				{children}
			</WidgetBase>
		</DragContext.Provider>
	);
};

export default Widget;
