import { Badge } from '@rocket.chat/fuselage';
import React from 'react';

import { useFeaturePreview } from '../../../hooks/useFeaturePreview';

const AccountFeaturePreviewBadge = () => {
	const { newFeatures } = useFeaturePreview();

	if (!newFeatures) {
		return null;
	}

	return <Badge variant='primary'>{newFeatures}</Badge>;
};

export default AccountFeaturePreviewBadge;
