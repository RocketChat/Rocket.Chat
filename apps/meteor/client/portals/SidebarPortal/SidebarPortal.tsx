import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type SidebarPortalProps = { children: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	const { overlayed, setOverlayed } = useLayout().sidebar;
	const [sidebarRoot, setSidebarRoot] = useState(() => document.getElementById('sidebar-region'));

	useEffect(() => {
		setOverlayed(true);
		return () => setOverlayed(false);
	}, [setOverlayed]);

	useEffect(() => {
		setSidebarRoot(document.getElementById('sidebar-region'));
	}, [overlayed]);

	if (!sidebarRoot) {
		return null;
	}

	return <>{createPortal(<Box className='sidebar-region-item flex-nav'>{children}</Box>, sidebarRoot)}</>;
};

export default memo(SidebarPortal);
