import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../contexts/TranslationContext';

export const EmptyStarredMessages = () => {
	const t = useTranslation();

	return (
		<Box fontScale='p2'>
			{t('No_starred_messages')}
		</Box>
	);
};
