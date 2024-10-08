import { Badge } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';

import { usePreferenceFeaturePreviewList } from '../../hooks/usePreferenceFeaturePreviewList';

const FeaturePreviewBadge = () => {
	const t = useTranslation();
	const { unseenFeatures } = usePreferenceFeaturePreviewList();

	if (!unseenFeatures) {
		return null;
	}

	return (
		<Badge variant='primary' aria-label={t('Unseen_features')}>
			{unseenFeatures}
		</Badge>
	);
};

export default FeaturePreviewBadge;
