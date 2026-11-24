import { Box, AnimatedVisibility } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { NAVIGATION_REGION_ID } from '../../lib/constants';

export type SidebarPortalProps = { children: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	const { overlayed, setOverlayed } = useLayout().sidebar;
	const [sidebarRoot, setSidebarRoot] = useState(() => document.getElementById(NAVIGATION_REGION_ID));

	useEffect(() => {
		setOverlayed(true);
		return () => setOverlayed(false);
	}, [setOverlayed]);

	useEffect(() => {
		setSidebarRoot(document.getElementById(NAVIGATION_REGION_ID));
	}, [overlayed]);

	if (!sidebarRoot) {
		return null;
	}

	return (
		<>
			{createPortal(
				<AnimatedVisibility visibility={AnimatedVisibility.UNHIDING}>
					<Box className='flex-nav'>{children}</Box>
				</AnimatedVisibility>,
				sidebarRoot,
			)}
		</>
	);
};

export default memo(SidebarPortal);
