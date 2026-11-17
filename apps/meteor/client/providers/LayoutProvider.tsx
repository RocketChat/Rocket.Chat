import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useEmbeddedLayout, useFeaturePreview } from '@rocket.chat/ui-client';
import { LayoutContext, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';

export type LayoutProviderProps = {
	children?: ReactNode;
};

const LayoutProvider = ({ children }: LayoutProviderProps) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [displaySidePanel, setDisplaySidePanel] = useState(true);
	const [overlayed, setOverlayed] = useState(false);
	const [navBarSearchExpanded, setNavBarSearchExpanded] = useState(false);
	const breakpoints = useBreakpoints(); // ["xs", "sm", "md", "lg", "xl", xxl"]
	const secondSidebarEnabled = useFeaturePreview('secondarySidebar');

	const router = useRouter();
	const isEmbedded = useEmbeddedLayout();

	const isMobile = !breakpoints.includes('md');
	const isTablet = !breakpoints.includes('lg');

	const shouldToggle = secondSidebarEnabled ? isTablet || isMobile : isMobile;
	const shouldDisplaySidePanel = !isTablet || displaySidePanel;
	const defaultSidebarWidth = secondSidebarEnabled ? '220px' : '240px';

	useEffect(() => {
		setIsCollapsed(shouldToggle);
	}, [shouldToggle]);

	return (
		<LayoutContext.Provider
			value={useMemo(
				() => ({
					isMobile,
					isTablet,
					navbar: {
						searchExpanded: navBarSearchExpanded,
						expandSearch: isMobile ? () => setNavBarSearchExpanded(true) : undefined,
						collapseSearch: isMobile ? () => setNavBarSearchExpanded(false) : undefined,
					},
					sidebar: {
						overlayed,
						setOverlayed,
						isCollapsed,
						shouldToggle,
						toggle: shouldToggle ? () => setIsCollapsed((isCollapsed) => !isCollapsed) : () => undefined,
						collapse: () => setIsCollapsed(true),
						expand: () => setIsCollapsed(false),
						close: () => (isEmbedded ? setIsCollapsed(true) : router.navigate('/home')),
					},
					sidePanel: {
						displaySidePanel: shouldDisplaySidePanel,
						closeSidePanel: () => setDisplaySidePanel(false),
						openSidePanel: () => setDisplaySidePanel(true),
					},
					size: {
						sidebar: shouldToggle ? '280px' : defaultSidebarWidth,
						// oxlint-disable-next-line no-nested-ternary
						contextualBar: breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%',
					},
					roomToolboxExpanded: breakpoints.includes('lg'),
					contextualBarExpanded: breakpoints.includes('sm'),
					// oxlint-disable-next-line no-nested-ternary
					contextualBarPosition: breakpoints.includes('sm') ? (breakpoints.includes('lg') ? 'relative' : 'absolute') : 'fixed',
				}),
				[
					isMobile,
					isTablet,
					isEmbedded,
					navBarSearchExpanded,
					overlayed,
					isCollapsed,
					shouldToggle,
					shouldDisplaySidePanel,
					defaultSidebarWidth,
					breakpoints,
					router,
				],
			)}
		>
			{children}
		</LayoutContext.Provider>
	);
};

export default LayoutProvider;
