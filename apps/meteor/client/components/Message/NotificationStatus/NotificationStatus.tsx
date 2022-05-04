import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';

const NotificationStatus: FC<{
	label: TranslationKey;
	bg: string;
}> = function NotificationStatus({ label, ...props }) {
	const t = useTranslation();
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />;
};

export default NotificationStatus;
