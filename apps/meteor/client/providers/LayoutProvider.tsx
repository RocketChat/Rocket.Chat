import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { LayoutContext, useQueryStringParameter, useSetting } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import { menu } from '../../app/ui-utils/client';

const LayoutProvider: FC = ({ children }) => {
	const showTopNavbarEmbeddedLayout = Boolean(useSetting('UI_Show_top_navbar_embedded_layout'));
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
					sidebar: menu,
					size: {
						sidebar: '240px',
						// eslint-disable-next-line no-nested-ternary
						contextualBar: breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%',
					},
					contextualBarExpanded: !breakpoints.includes('xxxl') && breakpoints.includes('sm'),
					// eslint-disable-next-line no-nested-ternary
					contextualBarPosition: breakpoints.includes('sm') ? (breakpoints.includes('lg') ? 'relative' : 'absolute') : 'fixed',
				}),
				[isEmbedded, showTopNavbarEmbeddedLayout, breakpoints],
			)}
		/>
	);
};

export default LayoutProvider;
