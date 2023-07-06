import { Badge } from '@rocket.chat/fuselage';
import React from 'react';

import { useFeaturePreviewList } from '../../../hooks/useFeaturePreviewList';

const AccountFeaturePreviewBadge = () => {
	const { unseenFeatures } = useFeaturePreviewList();

	if (!unseenFeatures) {
		return null;
	}

	return (
		<Badge variant='primary' aria-label='Unseen Features'>
			{unseenFeatures}
		</Badge>
	);
};

export default AccountFeaturePreviewBadge;
