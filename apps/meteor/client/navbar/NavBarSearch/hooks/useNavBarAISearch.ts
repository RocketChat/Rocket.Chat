import type { OverlayTriggerState } from '@react-stately/overlays';
import {
	AI_LICENSE_MODULE,
	buildAppliedFilterChips,
	extractCompletedSearchFilters,
	getAISearchButtonTooltip,
	mergeSearchFilters,
	type NavBarSearchFormValues,
} from '@rocket.chat/ai-search';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseFormSetFocus, UseFormSetValue } from 'react-hook-form';
import type { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type TranslationFn = ReturnType<typeof useTranslation>['t'];

export const useNavBarAISearch = ({
	filterText,
	appliedFilters,
	setFocus,
	setValue,
	state,
	t,
}: {
	filterText: NavBarSearchFormValues['filterText'];
	appliedFilters: NavBarSearchFormValues['appliedFilters'];
	setFocus: UseFormSetFocus<NavBarSearchFormValues>;
	setValue: UseFormSetValue<NavBarSearchFormValues>;
	state: OverlayTriggerState;
	t: TranslationFn;
}) => {
	const intelligentSearchEnabled = useSetting<boolean>('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canSearchWithAIFromTopBar = hasIntelligentSearchLicense && intelligentSearchEnabled;
	const [aiSearchRequested, setAISearchRequested] = useState(false);
	const aiSearchActive = Boolean(aiSearchRequested && canSearchWithAIFromTopBar);

	const appliedFilterChips = useMemo(
		() => (aiSearchActive ? buildAppliedFilterChips(appliedFilters, t) : []),
		[aiSearchActive, appliedFilters, t],
	);

	const handleRemoveFilter = useCallback(
		(filterKey: string) => {
			setValue(
				'appliedFilters',
				{
					...appliedFilters,
					...(filterKey === 'in' && { roomNames: [], rids: [], rid: undefined }),
					...(filterKey === 'from' && { fromUsernames: [], fromUsername: undefined }),
					...(filterKey === 'after' && { startDate: undefined }),
					...(filterKey === 'before' && { endDate: undefined }),
				},
				{ shouldDirty: true },
			);
			setFocus('filterText');
		},
		[appliedFilters, setFocus, setValue],
	);

	const handleToggleAISearch = useCallback(() => {
		if (!canSearchWithAIFromTopBar) {
			return;
		}

		setAISearchRequested((current) => !current);
		state.open();
		setFocus('filterText');
	}, [canSearchWithAIFromTopBar, setFocus, state]);

	useEffect(() => {
		if (canSearchWithAIFromTopBar || !aiSearchRequested) {
			return;
		}

		setAISearchRequested(false);
	}, [aiSearchRequested, canSearchWithAIFromTopBar]);

	useEffect(() => {
		if (!aiSearchActive || !filterText) {
			return;
		}

		const { searchText, filters, hasCompletedFilters } = extractCompletedSearchFilters(filterText);
		if (!hasCompletedFilters) {
			return;
		}

		setValue('appliedFilters', mergeSearchFilters(appliedFilters, filters), { shouldDirty: true });
		setValue('filterText', searchText, { shouldDirty: true });
	}, [aiSearchActive, appliedFilters, filterText, setValue]);

	return {
		aiSearchActive,
		canSearchWithAIFromTopBar,
		appliedFilterChips,
		aiSearchButtonTooltip: getAISearchButtonTooltip({ hasIntelligentSearchLicense, intelligentSearchEnabled, aiSearchActive, t }),
		handleRemoveFilter,
		handleToggleAISearch,
	};
};
