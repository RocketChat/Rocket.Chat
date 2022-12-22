import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

const NotificationStatus: FC<{
	label: TranslationKey;
	bg: string;
}> = function NotificationStatus({ label, ...props }) {
	const t = useTranslation();
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />;
};

export default NotificationStatus;
