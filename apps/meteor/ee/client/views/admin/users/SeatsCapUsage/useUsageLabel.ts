import { useTranslation } from '@rocket.chat/ui-contexts';

export const useUsageLabel = (percentage: number): string => {
	const fixedPercentage = percentage.toFixed(0);
	const t = useTranslation();

	if (percentage >= 100) {
		return t('Out_of_seats');
	}

	return `${fixedPercentage}% ${t('Usage')}`;
};
