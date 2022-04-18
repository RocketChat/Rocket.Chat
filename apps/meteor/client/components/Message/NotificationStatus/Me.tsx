import React, { FC } from 'react';

import NotificationStatus from './NotificationStatus';

const Me: FC = function Me(props) {
	return <NotificationStatus label='Me' bg='danger-500' {...props} />;
};

export default Me;
