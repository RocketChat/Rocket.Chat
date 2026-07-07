import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import Condensed from '../Item/Condensed';
import Extended from '../Item/Extended';
import { normalizeSidebarViewMode } from '../lib/normalizeSidebarViewMode';

export const useTemplateByViewMode = (): typeof Condensed | typeof Extended => {
	const sidebarViewMode = normalizeSidebarViewMode(useUserPreference('sidebarViewMode'));
	return useMemo(() => {
		switch (sidebarViewMode) {
			case 'extended':
				return Extended;
			case 'condensed':
			default:
				return Condensed;
		}
	}, [sidebarViewMode]);
};
