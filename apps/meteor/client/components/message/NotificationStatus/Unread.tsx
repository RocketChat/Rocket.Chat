import type { FC } from 'react';
import React from 'react';

import NotificationStatus from './NotificationStatus';

const Unread: FC = function Unread(props) {
	return <NotificationStatus label='Unread' bg='primary-500' {...props} />;
};

export default Unread;
