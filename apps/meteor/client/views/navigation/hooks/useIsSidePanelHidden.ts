import { useLayout } from '@rocket.chat/ui-contexts';

export const useIsSidePanelHidden = () => {
	const { isTablet, sidebar } = useLayout();

	return sidebar.overlayed || (sidebar.isCollapsed && isTablet);
};
