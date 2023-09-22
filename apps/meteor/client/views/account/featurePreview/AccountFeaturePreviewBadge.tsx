import { Badge } from '@rocket.chat/fuselage';
import { useFeaturePreviewList } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

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
