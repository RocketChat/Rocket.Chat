import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type SidebarPortalProps = { children: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	const sidebarRoot = document.getElementById('sidebar-region');
	const {
		sidebar: { setOverlayed },
	} = useLayout();

	useEffect(() => {
		if (sidebarRoot) {
			setOverlayed(true);
		}

		return () => setOverlayed(false);
	}, [setOverlayed, sidebarRoot]);

	if (!sidebarRoot) {
		return null;
	}

	return <>{createPortal(<Box className='sidebar-region-item flex-nav'>{children}</Box>, sidebarRoot)}</>;
};

export default memo(SidebarPortal);
