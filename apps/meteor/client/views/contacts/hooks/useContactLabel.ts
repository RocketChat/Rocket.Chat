import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const PROVIDER_LABELS: Record<string, string> = {
	mobile: 'Contact_label_mobile',
	business: 'Contact_label_business',
	home: 'Contact_label_home',
};

export const useContactLabel = () => {
	const { t } = useTranslation();

	return useCallback((label?: string) => (label && PROVIDER_LABELS[label] ? t(PROVIDER_LABELS[label]) : label), [t]);
};
