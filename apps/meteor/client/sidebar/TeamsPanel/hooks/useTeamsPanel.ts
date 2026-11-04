import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';

import { teamsPanelStore } from '../teamsPanelStore';

/**
 * The Teams panel is reached from the sidebar rail, so it is available exactly where the rail is: with the
 * `sidebarRail` preview on, outside the embedded layout and on screens wide enough to show the rail.
 *
 * It replaces the legacy sidebar's room list, so it is not offered alongside the `secondarySidebar` preview, which
 * renders a navigation of its own.
 */
export const useTeamsPanelAvailable = () => {
	const railEnabled = useFeaturePreview('sidebarRail');
	const secondarySidebarEnabled = useFeaturePreview('secondarySidebar');
	const {
		isEmbedded,
		sidebar: { shouldToggle },
	} = useLayout();

	return railEnabled && !secondarySidebarEnabled && !isEmbedded && !shouldToggle;
};

export const useTeamsPanel = () => {
	const available = useTeamsPanelAvailable();
	const open = teamsPanelStore((state) => state.open);
	const show = teamsPanelStore((state) => state.show);
	const close = teamsPanelStore((state) => state.close);

	return { available, open: available && open, show, close };
};
