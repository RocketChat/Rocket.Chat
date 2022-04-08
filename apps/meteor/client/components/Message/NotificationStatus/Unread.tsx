import React, { FC } from 'react';

import NotificationStatus from './NotificationStatus';

const Unread: FC<{ t: (key: string) => string }> = function Unread(props) {
	return <NotificationStatus label='Unread' bg='primary-500' {...props} />;
};

export default Unread;
