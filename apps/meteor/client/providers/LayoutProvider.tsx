import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
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
	const [navBarSearchExpanded, setNavBarSearchExpanded] = useState(false);
	const breakpoints = useBreakpoints(); // ["xs", "sm", "md", "lg", "xl", xxl"]
	const [hiddenActions, setHiddenActions] = useState(hiddenActionsDefaultValue);

	const router = useRouter();
	// Once the layout is embedded, it can't be changed
	const [isEmbedded] = useState(() => router.getSearchParameters().layout === 'embedded');

	const isMobile = !breakpoints.includes('md');
	const isTablet = !breakpoints.includes('lg');

	const shouldToggle = isTablet || isMobile;

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
						isCollapsed,
						toggle: shouldToggle ? () => setIsCollapsed((isCollapsed) => !isCollapsed) : () => undefined,
						collapse: () => setIsCollapsed(true),
						expand: () => setIsCollapsed(false),
						close: () => (isEmbedded ? setIsCollapsed(true) : router.navigate('/home')),
					},
					size: {
						sidebar: '240px',
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
					navBarSearchExpanded,
					isEmbedded,
					showTopNavbarEmbeddedLayout,
					isCollapsed,
					shouldToggle,
					breakpoints,
					hiddenActions,
					router,
				],
			)}
		/>
	);
};

export default LayoutProvider;
