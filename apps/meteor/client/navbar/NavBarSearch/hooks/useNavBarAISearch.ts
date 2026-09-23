import type { OverlayTriggerState } from '@react-stately/overlays';
import { AI_LICENSE_MODULE, getAISearchButtonTooltip } from '@rocket.chat/ai-search';
import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import type { UseFormSetFocus } from 'react-hook-form';
import type { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type TranslationFn = ReturnType<typeof useTranslation>['t'];

/** Availability and the AI Search toggle. Filter state lives in `useSearchFilters`. */
export const useNavBarAISearch = ({
	setFocus,
	state,
	t,
}: {
	setFocus: UseFormSetFocus<NavBarSearchFormValues>;
	state: OverlayTriggerState;
	t: TranslationFn;
}) => {
	const intelligentSearchEnabled = useSetting<boolean>('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	// const canSearchWithAIFromTopBar = hasIntelligentSearchLicense && intelligentSearchEnabled;
	const canSearchWithAIFromTopBar = true; // For testing purposes, we are enabling AI search regardless of license and setting. Remove this line in production.
	const [aiSearchRequested, setAISearchRequested] = useState(false);
	const aiSearchActive = Boolean(aiSearchRequested && canSearchWithAIFromTopBar);

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

	return {
		aiSearchActive,
		canSearchWithAIFromTopBar,
		aiSearchButtonTooltip: getAISearchButtonTooltip({ hasIntelligentSearchLicense, intelligentSearchEnabled, aiSearchActive, t }),
		handleToggleAISearch,
	};
};
