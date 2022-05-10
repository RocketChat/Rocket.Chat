import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import React, { FC, useContext, useMemo } from 'react';

import { menu } from '../../app/ui-utils/client';
import { LayoutContext, SizeLayout, LayoutContextValue } from '../contexts/LayoutContext';
import { useQueryStringParameter } from '../contexts/RouterContext';
import { useSetting } from '../contexts/SettingsContext';

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

export const useLayoutSizes = (): SizeLayout => useContext(LayoutContext).size;
export const useLayoutContextualBarExpanded = (): boolean => useContext(LayoutContext).contextualBarExpanded;
export const useLayoutContextualBarPosition = (): LayoutContextValue['contextualBarPosition'] =>
	useContext(LayoutContext).contextualBarPosition;
