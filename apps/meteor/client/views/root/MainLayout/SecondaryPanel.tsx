import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';

import Sidebar from '../../../sidebar';
import SidebarRailCallPanel from '../../../sidebar/SidebarRail/SidebarRailCallPanel';
import NavigationRegion from '../../navigation';
import RoomsNavigationProvider from '../../navigation/providers/RoomsNavigationProvider';

type SecondaryPanelProps = {
	showSidebarRail: boolean;
	currentRoutePath?: string;
};

const SecondaryPanel = ({ showSidebarRail, currentRoutePath }: SecondaryPanelProps) => {
	if (showSidebarRail && currentRoutePath?.includes('/call-history')) {
		return <SidebarRailCallPanel />;
	}

	return (
		<FeaturePreview feature='secondarySidebar'>
			<FeaturePreviewOn>
				<RoomsNavigationProvider>
					<NavigationRegion />
				</RoomsNavigationProvider>
			</FeaturePreviewOn>
			<FeaturePreviewOff>
				<Sidebar />
			</FeaturePreviewOff>
		</FeaturePreview>
	);
};

export default SecondaryPanel;
