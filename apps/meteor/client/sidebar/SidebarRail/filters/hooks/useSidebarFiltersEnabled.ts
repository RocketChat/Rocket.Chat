import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';

// Entry points only show where the filters panel can actually render.
export const useSidebarFiltersEnabled = (): boolean => {
	const sidebarRailEnabled = useFeaturePreview('sidebarRail');
	const {
		isEmbedded,
		sidebar: { shouldToggle },
	} = useLayout();

	return sidebarRailEnabled && !shouldToggle && !isEmbedded;
};
