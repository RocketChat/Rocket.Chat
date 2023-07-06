import { Badge } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useFeaturePreviewList } from '../../../hooks/useFeaturePreviewList';

const AccountFeaturePreviewBadge = () => {
	const t = useTranslation();
	const { unseenFeatures } = useFeaturePreviewList();

	if (!unseenFeatures) {
		return null;
	}

	return (
		<Badge variant='primary' aria-label={t('Unseen_features')}>
			{unseenFeatures}
		</Badge>
	);
};

export default AccountFeaturePreviewBadge;
