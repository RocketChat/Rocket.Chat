import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { LayoutContext, useQueryStringParameter, useSetting } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo, useState } from 'react';

import { menu } from '../../app/ui-utils/client';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

const LayoutProvider: FC = ({ children }) => {
	const showTopNavbarEmbeddedLayout = Boolean(useSetting('UI_Show_top_navbar_embedded_layout'));
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const layout = useQueryStringParameter('layout');
	const isEmbedded = layout === 'embedded';
	const breakpoints = useBreakpoints();
	// ["xs", "sm", "md", "lg", "xl", xxl"]

	return (
		<LayoutContext.Provider
			children={children}
			value={useMemo(
				() => ({
					isMobile: !breakpoints.includes('md'),
					isEmbedded,
					showTopNavbarEmbeddedLayout,
					sidebar: {
						isOpen: isSidebarOpen,
						toggle: () => setIsSidebarOpen((isSidebarOpen) => !isSidebarOpen),
					},
					size: {
						sidebar: '240px',
						// eslint-disable-next-line no-nested-ternary
						contextualBar: breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%',
					},
					contextualBarExpanded: breakpoints.includes('sm'),
					// eslint-disable-next-line no-nested-ternary
					contextualBarPosition: breakpoints.includes('sm') ? (breakpoints.includes('lg') ? 'relative' : 'absolute') : 'fixed',
				}),
				[isEmbedded, showTopNavbarEmbeddedLayout, breakpoints, isSidebarOpen],
			)}
		/>
	);
};

export default LayoutProvider;
