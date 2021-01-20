import React from 'react';
import { Box } from '@rocket.chat/fuselage';

export function NotificationStatus({ t = (e) => e, label, ...props }) {
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' {...props} />;
}

export function All(props) {
	return <NotificationStatus label='mention-all' bg='#F38C39' {...props} />;
}

export function Me(props) {
	return <NotificationStatus label='Me' bg='danger-500' {...props} />;
}

export function Unread(props) {
	return <NotificationStatus label='Unread' bg='primary-500' {...props} />;
}
