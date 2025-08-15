import { Box, AnimatedVisibility } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { NAVIGATION_REGION_ID } from '../../lib/constants';

type SidebarPortalProps = { children?: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	const sidebarRoot = document.getElementById(NAVIGATION_REGION_ID);
	const { sidebar } = useLayout();

	useEffect(() => {
		if (sidebarRoot) {
			sidebar.setOverlayed(true);
		}

		return () => sidebar.setOverlayed(false);
	}, [sidebar, sidebarRoot]);

	if (!sidebarRoot) {
		return null;
	}

	return (
		<>
			{createPortal(
				<AnimatedVisibility visibility={AnimatedVisibility.UNHIDING}>
					<Box className='rcx-sidebar flex-nav'>{children}</Box>
				</AnimatedVisibility>,
				sidebarRoot,
			)}
		</>
	);
};

export default memo(SidebarPortal);
