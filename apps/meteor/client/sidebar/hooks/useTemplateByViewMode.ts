import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import Condensed from '../Item/Condensed';
import Extended from '../Item/Extended';

export const useTemplateByViewMode = (): typeof Condensed | typeof Extended => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
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
