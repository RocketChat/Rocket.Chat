import { Box } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

const NotificationStatus: FC<{
	label: TranslationKey;
	bg: string;
}> = function NotificationStatus({ label, ...props }) {
	const t = useTranslation();
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />;
};

export default NotificationStatus;
