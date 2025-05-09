import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';

export const useSidePanelNavigation = () => {
	const isSidepanelFeatureEnabled = useFeaturePreview('sidepanelNavigation');
	// ["xs", "sm", "md", "lg", "xl", xxl"]
	return useSidePanelNavigationScreenSize() && isSidepanelFeatureEnabled;
};

export const useSidePanelNavigationScreenSize = () => {
	const breakpoints = useBreakpoints();
	// ["xs", "sm", "md", "lg", "xl", xxl"]
	return breakpoints.includes('lg');
};
