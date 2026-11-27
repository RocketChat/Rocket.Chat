import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';

import { teamsPanelStore } from '../teamsPanelStore';

export const useTeamsPanel = () => {
	const railEnabled = useFeaturePreview('sidebarRail');
	const secondarySidebarEnabled = useFeaturePreview('secondarySidebar');
	const {
		isEmbedded,
		sidebar: { shouldToggle },
	} = useLayout();
	const open = teamsPanelStore((state) => state.open);
	const show = teamsPanelStore((state) => state.show);
	const close = teamsPanelStore((state) => state.close);

	const available = railEnabled && !secondarySidebarEnabled && !isEmbedded && !shouldToggle;

	return { available, open: available && open, show, close };
};
