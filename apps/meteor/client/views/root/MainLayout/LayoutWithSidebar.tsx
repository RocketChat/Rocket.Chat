import { Box } from '@rocket.chat/fuselage';
import { useLayout, useCurrentRoute, useRoutePath, useSetting, useCurrentModal } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BlazeTemplate from '../BlazeTemplate';

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const [currentRouteName = '', currentParameters = {}] = useCurrentRoute();

	const modal = useCurrentModal();
	const currentRoutePath = useRoutePath(currentRouteName, currentParameters);
	const removeSidenav = useReactiveValue(
		useCallback(() => embeddedLayout && !currentRoutePath?.startsWith('/admin'), [currentRoutePath, embeddedLayout]),
	);
	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Store_Users');

	return (
		<Box
			bg='surface-light'
			id='rocket-chat'
			className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}
			aria-hidden={Boolean(modal)}
		>
			{!removeSidenav ? <BlazeTemplate template='sideNav' /> : null}
			<div className={['rc-old', 'main-content', readReceiptsEnabled ? 'read-receipts-enabled' : undefined].filter(Boolean).join(' ')}>
				{children}
			</div>
		</Box>
	);
};

export default LayoutWithSidebar;
