import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

type SidebarPortalProps = { children?: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	const sidebarRoot = document.getElementById('sidebar-region');

	if (!sidebarRoot) {
		return null;
	}

	return <>{createPortal(<Box className='rcx-sidebar flex-nav'>{children}</Box>, sidebarRoot)}</>;
};

export default memo(SidebarPortal);
