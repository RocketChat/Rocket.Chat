import React, { FC } from 'react';

import { menu } from '../../app/ui-utils/client';
import { SidebarContext } from '../contexts/SidebarContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

const getOpen = (): boolean => menu.isOpen();

const setOpen = (open: boolean | ((isOpen: boolean) => boolean)): void => {
	if (typeof open === 'function') {
		open = open(menu.isOpen());
	}

	return open ? menu.open() : menu.close();
};

const SidebarProvider: FC = ({ children }) => (
	<SidebarContext.Provider children={children} value={[useReactiveValue<boolean>(getOpen), setOpen]} />
);

export default SidebarProvider;
