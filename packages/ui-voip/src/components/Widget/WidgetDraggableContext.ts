import type { Ref } from 'react';
import { createContext, useContext } from 'react';

type DragContextValue = {
	draggableRef: Ref<HTMLElement>;
	boundingRef: Ref<HTMLElement>;
	handleRef: Ref<HTMLElement>;
};

export const DragContext = createContext<DragContextValue | undefined>(undefined);

export const useDraggableWidget = (): DragContextValue => {
	const context = useContext(DragContext);
	if (!context) {
		throw new Error('useDraggableWidget - context unavailable');
	}
	return context;
};
