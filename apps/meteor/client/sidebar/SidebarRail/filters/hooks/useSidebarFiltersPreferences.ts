import type { ISidebarFilter, ISidebarFiltersDisplay, ISubscriptionLabel } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { sanitizeDisplay, sanitizeFilters, sanitizeLabels } from '../lib/sanitize';

const emptyList: unknown[] = [];

const defaultDisplay: ISidebarFiltersDisplay = { viewMode: 'medium', displayAvatar: true };

export const useSubscriptionLabels = (): ISubscriptionLabel[] => {
	const rawLabels = useUserPreference<unknown>('subscriptionLabels', emptyList);

	return useMemo(() => sanitizeLabels(rawLabels), [rawLabels]);
};

export const useSidebarFilters = (): ISidebarFilter[] => {
	const labels = useSubscriptionLabels();
	const rawFilters = useUserPreference<unknown>('sidebarFilters', emptyList);

	return useMemo(() => sanitizeFilters(rawFilters, labels), [rawFilters, labels]);
};

export const useSidebarFiltersDisplay = (): ISidebarFiltersDisplay => {
	const rawDisplay = useUserPreference<unknown>('sidebarFiltersDisplay', defaultDisplay);

	return useMemo(() => sanitizeDisplay(rawDisplay, defaultDisplay), [rawDisplay]);
};
