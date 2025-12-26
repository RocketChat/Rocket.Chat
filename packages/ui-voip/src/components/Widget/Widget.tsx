import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { FocusScope } from 'react-aria';

import { DragContext } from './WidgetDraggableContext';
import { useDraggable } from '../../hooks';

type WidgetBaseProps = {
	expanded?: boolean;
};

// TODO: Initial position from the draggable api instead of style props
// TODO: A11Y
const WidgetBase = styled('article', ({ expanded: _expanded, ...props }: WidgetBaseProps) => props)`
	position: fixed;
	right: 2em;
	top: 11em;
	display: flex;
	flex-direction: column;
	${({ expanded }) => (expanded ? `width: 248px; min-height: 256px;` : `width: 248px; min-height: 128px;`)}
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

type WidgetProps = WidgetBaseProps & {
	children: ReactNode;
};

const Widget = ({ children, expanded, ...props }: WidgetProps) => {
	const [draggableRef, boundingRef, handleRef] = useDraggable();

	useLayoutEffect(() => {
		boundingRef(document.body);
	}, [boundingRef]);

	return (
		<DragContext.Provider value={{ draggableRef, boundingRef, handleRef }}>
			<FocusScope autoFocus>
				<WidgetBase
					{...props}
					expanded={expanded}
					ref={draggableRef}
					aria-labelledby='rcx-media-call-widget-title rcx-media-call-widget-caller-info'
				>
					{children}
				</WidgetBase>
			</FocusScope>
		</DragContext.Provider>
	);
};

export default Widget;
