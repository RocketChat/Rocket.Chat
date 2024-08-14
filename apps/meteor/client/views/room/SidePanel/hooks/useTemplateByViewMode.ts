import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

import { Condensed, Extended, Medium } from '../SidePanelItem';

export const useTemplateByViewMode = (): ComponentType<any> => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	return useMemo(() => {
		switch (sidebarViewMode) {
			case 'extended':
				return Extended;
			case 'medium':
				return Medium;
			case 'condensed':
			default:
				return Condensed;
		}
	}, [sidebarViewMode]);
};
