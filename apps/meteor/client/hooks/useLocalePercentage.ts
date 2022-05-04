import { useLanguage } from '../contexts/TranslationContext';
import { getLocalePercentage } from '../lib/getLocalePercentage';

export const useLocalePercentage = (total: number, fraction: number, decimalCount: number | undefined): string => {
	const locale = useLanguage();
	return getLocalePercentage(locale, total, fraction, decimalCount);
};
