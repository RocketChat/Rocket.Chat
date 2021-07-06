import { Box } from '@rocket.chat/fuselage';
import React from 'react';

function NotificationStatus({ t = (e) => e, label, ...props }) {
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />;
}

export default NotificationStatus;
