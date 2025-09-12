import { createContext, Ref, useContext } from 'react';

export const DragContext = createContext<{
	draggableRef: Ref<HTMLElement>;
	boundingRef: Ref<HTMLElement>;
	handleRef: Ref<HTMLElement>;
}>({
	draggableRef: null,
	boundingRef: null,
	handleRef: null,
});

export const useDraggableWidget = () => {
	const context = useContext(DragContext);
	if (!context) {
		throw new Error('useDraggableWidget - context unavailable');
	}
	return context;
};
