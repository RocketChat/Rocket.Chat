import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { LayoutContext, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';

const hiddenActionsDefaultValue = {
	roomToolbox: [],
	messageToolbox: [],
	composerToolbox: [],
	userToolbox: [],
};

type LayoutProviderProps = {
	children?: ReactNode;
};

const LayoutProvider = ({ children }: LayoutProviderProps) => {
	const showTopNavbarEmbeddedLayout = useSetting('UI_Show_top_navbar_embedded_layout', false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [displaySidePanel, setDisplaySidePanel] = useState(true);
	const [overlayed, setOverlayed] = useState(false);
	const [navBarSearchExpanded, setNavBarSearchExpanded] = useState(false);
	const breakpoints = useBreakpoints(); // ["xs", "sm", "md", "lg", "xl", xxl"]
	const [hiddenActions, setHiddenActions] = useState(hiddenActionsDefaultValue);
	const enhancedNavigationEnabled = useFeaturePreview('newNavigation');

	const router = useRouter();
	// Once the layout is embedded, it can't be changed
	const [isEmbedded] = useState(() => router.getSearchParameters().layout === 'embedded');

	const isMobile = !breakpoints.includes('md');
	const isTablet = !breakpoints.includes('lg');

	const shouldToggle = enhancedNavigationEnabled ? isTablet || isMobile : isMobile;

	const shouldDisplaySidePanel = useMemo(() => {
		if (!isTablet) {
			return true;
		}

		return displaySidePanel;
	}, [displaySidePanel, isTablet]);

	useEffect(() => {
		setIsCollapsed(shouldToggle);
	}, [shouldToggle]);

	useEffect(() => {
		const eventHandler = (event: MessageEvent<any>) => {
			if (event.data?.event !== 'overrideUi') {
				return;
			}

			setHiddenActions({ ...hiddenActionsDefaultValue, ...event.data.hideActions });
		};
		window.addEventListener('message', eventHandler);
		return () => window.removeEventListener('message', eventHandler);
	}, []);

	return (
		<LayoutContext.Provider
			children={children}
			value={useMemo(
				() => ({
					isMobile,
					isTablet,
					isEmbedded,
					showTopNavbarEmbeddedLayout,
					navbar: {
						searchExpanded: navBarSearchExpanded,
						expandSearch: isMobile ? () => setNavBarSearchExpanded(true) : undefined,
						collapseSearch: isMobile ? () => setNavBarSearchExpanded(false) : undefined,
					},
					sidebar: {
						overlayed,
						setOverlayed,
						isCollapsed,
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
						sidebar: isTablet ? '280px' : '240px',
						// eslint-disable-next-line no-nested-ternary
						contextualBar: breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%',
					},
					roomToolboxExpanded: breakpoints.includes('lg'),
					contextualBarExpanded: breakpoints.includes('sm'),
					// eslint-disable-next-line no-nested-ternary
					contextualBarPosition: breakpoints.includes('sm') ? (breakpoints.includes('lg') ? 'relative' : 'absolute') : 'fixed',
					hiddenActions,
				}),
				[
					isMobile,
					isTablet,
					isEmbedded,
					showTopNavbarEmbeddedLayout,
					navBarSearchExpanded,
					overlayed,
					isCollapsed,
					shouldToggle,
					shouldDisplaySidePanel,
					breakpoints,
					hiddenActions,
					router,
				],
			)}
		/>
	);
};

export default LayoutProvider;
