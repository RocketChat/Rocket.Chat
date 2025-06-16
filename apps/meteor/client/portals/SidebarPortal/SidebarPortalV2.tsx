import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';

type SidebarPortalProps = { children?: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	const sidebarRoot = document.getElementById('navigation-region');
	const { setIsInternalScope } = useLayout();

	useEffect(() => {
		if (sidebarRoot) {
			setIsInternalScope(true);
		}

		return () => setIsInternalScope(false);
	}, [setIsInternalScope, sidebarRoot]);

	if (!sidebarRoot) {
		return null;
	}

	return <>{createPortal(<Box className='rcx-sidebar flex-nav'>{children}</Box>, sidebarRoot)}</>;
};

export default memo(SidebarPortal);
