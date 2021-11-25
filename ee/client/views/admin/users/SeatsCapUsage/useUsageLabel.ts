import { useTranslation } from '../../../../../../client/contexts/TranslationContext';

export const useUsageLabel = (percentage: number): string => {
	const fixedPercentage = percentage.toFixed(0);
	const t = useTranslation();

	if (percentage >= 100) {
		return t('Out_of_seats');
	}

	return `${fixedPercentage}% ${t('Usage')}`;
};
