import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

interface INotificationStatus {
	t?: (e: any) => any;
	label: string;
	bg: string;
}

const NotificationStatus: FC<INotificationStatus> = ({ t = (e) => e, label, ...props }) => (
	<Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />
);

export default NotificationStatus;
