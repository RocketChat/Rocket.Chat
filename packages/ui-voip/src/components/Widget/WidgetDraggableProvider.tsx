import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

import { DragContext } from './WidgetDraggableContext';
import { useMediaCallView } from '../../context';
import { useDraggable } from '../../hooks';

type WidgetDraggableProviderProps = {
	children: ReactNode;
};

const WidgetDraggableProvider = ({ children }: WidgetDraggableProviderProps) => {
	const { widgetPositionTracker } = useMediaCallView();
	const [draggableRef, boundingRef, handleRef] = useDraggable({
		onChangePosition: widgetPositionTracker?.onChangePosition,
		restorePosition: widgetPositionTracker?.getRestorePosition(),
	});

	useLayoutEffect(() => {
		boundingRef(document.body);
	}, [boundingRef]);

	return <DragContext.Provider value={{ draggableRef, boundingRef, handleRef }}>{children}</DragContext.Provider>;
};

export default WidgetDraggableProvider;
