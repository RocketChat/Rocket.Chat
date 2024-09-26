import { Badge } from '@rocket.chat/fuselage';
import { useFeaturePreviewList } from '@rocket.chat/ui-client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AccountFeaturePreviewBadge = () => {
	const { t } = useTranslation();
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
