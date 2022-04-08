import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const NotificationStatus: FC<{
	label: string;
	t: (key: string) => string;
	bg: string;
}> = function NotificationStatus({ t = (e) => e, label, ...props }) {
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />;
};

export default NotificationStatus;
