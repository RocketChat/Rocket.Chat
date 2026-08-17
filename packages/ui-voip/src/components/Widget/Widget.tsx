import { FocusScope } from '@react-aria/focus';
import type { ReactNode } from 'react';

import WidgetBase from './WidgetBase';
import { useDraggableWidget } from './WidgetDraggableContext';

export type WidgetProps = {
	children: ReactNode;
	autoFocus?: boolean;
};

const Widget = ({ children, autoFocus = true, ...props }: WidgetProps) => {
	const draggableContext = useDraggableWidget();

	return (
		<FocusScope autoFocus={autoFocus}>
			<WidgetBase
				{...props}
				ref={draggableContext?.draggableRef}
				inline={!draggableContext}
				role='dialog'
				aria-labelledby='rcx-media-call-widget-title-prefix rcx-media-call-widget-title rcx-media-call-widget-caller-info'
			>
				{children}
			</WidgetBase>
		</FocusScope>
	);
};

export default Widget;
