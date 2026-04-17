import { VisuallyHidden } from '@react-aria/visually-hidden';
import { useTranslation } from 'react-i18next';

const ResultsLiveRegion = ({ shouldAnnounce, itemCount }: { shouldAnnounce: boolean; itemCount: number }) => {
	const { t } = useTranslation();

	if (itemCount === 0) {
		return <VisuallyHidden role='status'>{shouldAnnounce && t('No_results_found')}</VisuallyHidden>;
	}

	return <VisuallyHidden role='status'>{shouldAnnounce && t('__count__result_found', { count: itemCount })}</VisuallyHidden>;
};

export default ResultsLiveRegion;
