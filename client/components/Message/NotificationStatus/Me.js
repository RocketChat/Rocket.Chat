import React from 'react';

import NotificationStatus from './NotificationStatus';

function Me(props) {
	return <NotificationStatus label='Me' bg='danger-500' {...props} />;
}

export default Me;
