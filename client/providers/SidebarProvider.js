import React from 'react';

import { menu } from '../../app/ui-utils/client';
import { SidebarContext } from '../contexts/SidebarContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

const getOpen = () => menu.isOpen();

const setOpen = (open) => (open ? menu.open() : menu.close());

export function SidebarProvider({ children }) {
	const contextValue = [useReactiveValue(getOpen, []), setOpen];

	return <SidebarContext.Provider children={children} value={contextValue} />;
}
