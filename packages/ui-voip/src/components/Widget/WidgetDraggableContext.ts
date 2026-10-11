import type { RefCallback } from 'react';
import { createContext, useContext } from 'react';

type DragContextValue = {
	draggableRef: RefCallback<HTMLElement>;
	boundingRef: RefCallback<HTMLElement>;
	handleRef: RefCallback<HTMLElement>;
};

export const DragContext = createContext<DragContextValue | undefined>(undefined);

export const useDraggableWidget = (): DragContextValue | undefined => useContext(DragContext);
