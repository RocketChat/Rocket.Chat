import type { FC } from 'react';
import React from 'react';

import NotificationStatus from './NotificationStatus';

const All: FC = function All(props) {
	return <NotificationStatus label='mention-all' bg='#F38C39' {...props} />;
};

export default All;
