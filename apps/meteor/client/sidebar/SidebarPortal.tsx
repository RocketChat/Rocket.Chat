import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo } from 'react';
import { createPortal } from 'react-dom';

const SidebarPortal: FC = ({ children }) => {
	const sidebarRoot = document.getElementById('sidebar-region');

	if (!sidebarRoot) {
		return null;
	}

	return <>{createPortal(<Box className='rcx-sidebar flex-nav'>{children}</Box>, sidebarRoot)}</>;
};

export default memo<typeof SidebarPortal>(SidebarPortal);
