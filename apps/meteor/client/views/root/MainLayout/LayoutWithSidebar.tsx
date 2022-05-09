import { useLayout, useCurrentRoute, useRoutePath, useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BlazeTemplate from '../BlazeTemplate';

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const [currentRouteName = '', currentParameters = {}] = useCurrentRoute();
	const currentRoutePath = useRoutePath(currentRouteName, currentParameters);
	const removeSidenav = useReactiveValue(
		useCallback(() => embeddedLayout && !currentRoutePath?.startsWith('/admin'), [currentRoutePath, embeddedLayout]),
	);
	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Store_Users');

	return (
		<div id='rocket-chat' className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}>
			{!removeSidenav ? <BlazeTemplate template='sideNav' /> : null}
			<div
				className={['rc-old', 'main-content', 'content-background-color', readReceiptsEnabled ? 'read-receipts-enabled' : undefined]
					.filter(Boolean)
					.join(' ')}
			>
				{children}
			</div>
		</div>
	);
};

export default LayoutWithSidebar;
