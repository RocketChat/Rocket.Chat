import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import SidebarPortalV1 from './SidebarPortal';
import SidebarPortalV2 from './SidebarPortalV2';

export type SidebarPortalProps = { children: ReactNode };

const SidebarPortal = ({ children }: SidebarPortalProps) => {
	return (
		<FeaturePreview feature='secondarySidebar'>
			<FeaturePreviewOff>
				<SidebarPortalV1>{children}</SidebarPortalV1>
			</FeaturePreviewOff>
			<FeaturePreviewOn>
				<SidebarPortalV2>{children}</SidebarPortalV2>
			</FeaturePreviewOn>
		</FeaturePreview>
	);
};

export default SidebarPortal;
