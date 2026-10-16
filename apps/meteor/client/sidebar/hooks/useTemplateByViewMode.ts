import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import Condensed from '../Item/Condensed';
import Extended from '../Item/Extended';
import Medium from '../Item/Medium';

export const useTemplateByViewMode = (
	sidebarViewMode?: 'extended' | 'medium' | 'condensed',
): typeof Condensed | typeof Extended | typeof Medium => {
	const sidebarViewModeFromSettings = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode');

	const viewMode = sidebarViewMode ?? sidebarViewModeFromSettings;
	return useMemo(() => {
		switch (viewMode) {
			case 'extended':
				return Extended;
			case 'medium':
				return Medium;
			case 'condensed':
			default:
				return Condensed;
		}
	}, [viewMode]);
};
