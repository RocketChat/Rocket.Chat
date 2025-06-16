import { FeaturePreview } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

import { useSidePanelNavigationScreenSize } from '../hooks/useSidePanelNavigation';

export const FeaturePreviewSidePanelNavigation = ({ children }: { children: ReactElement[] }) => {
	const disabled = !useSidePanelNavigationScreenSize();
	return <FeaturePreview feature='sidepanelNavigation' disabled={disabled} children={children} />;
};
