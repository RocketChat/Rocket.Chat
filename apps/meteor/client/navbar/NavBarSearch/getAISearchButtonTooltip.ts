export const getAISearchButtonTooltip = ({
	hasIntelligentSearchLicense,
	intelligentSearchEnabled,
	t,
}: {
	hasIntelligentSearchLicense: boolean;
	intelligentSearchEnabled: unknown;
	t: (key: string) => string;
}): string => {
	if (!hasIntelligentSearchLicense) {
		return t('AI_Search_license_required_tooltip');
	}

	if (!intelligentSearchEnabled) {
		return t('AI_Search_disabled_tooltip');
	}

	return t('Search_with_AI');
};
