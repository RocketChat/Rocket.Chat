import { VisuallyHidden } from '@react-aria/visually-hidden';
import { useTranslation } from 'react-i18next';

const ResultsLiveRegion = ({
	shouldAnnounce,
	itemCount,
	isLoading = false,
}: {
	shouldAnnounce: boolean;
	itemCount: number;
	isLoading?: boolean;
}) => {
	const { t } = useTranslation();

	const message = (() => {
		if (isLoading) {
			return t('Loading');
		}
		if (!shouldAnnounce) {
			return '';
		}
		return itemCount === 0 ? t('No_results_found') : t('__count__result_found', { count: itemCount });
	})();

	return <VisuallyHidden role='status'>{message}</VisuallyHidden>;
};

export default ResultsLiveRegion;
