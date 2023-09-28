import type { ReactElement } from 'react';
import React, { cloneElement, createContext } from 'react';

import { useResizeObserver } from '../hooks/useResizeObserver';

export const ResizeContext = createContext(false);

type ResizeProviderProps = { children: ReactElement };

export const ResizeObserver = ({ children }: ResizeProviderProps) => {
	const { ref, isResizing } = useResizeObserver();

	return <ResizeContext.Provider value={isResizing}>{cloneElement(children, { ref })}</ResizeContext.Provider>;
};
