import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export type MovableRoom = { rid: string; name?: string; isFavorite?: boolean; categoryId?: string };

export const FAVORITES_TARGET = 'favorites';

export const useCustomCategories = () => {
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');

	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];

	return useMemo(() => (hasLicenseModule ? allEntries.filter((entry) => !entry.default) : []), [hasLicenseModule, allEntries]);
};
