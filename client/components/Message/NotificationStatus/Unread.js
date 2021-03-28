import React from 'react';

import NotificationStatus from './NotificationStatus';

function Unread(props) {
	return <NotificationStatus label='Unread' bg='primary-500' {...props} />;
}

export default Unread;
