import React, { FC } from 'react';

import NotificationStatus from './NotificationStatus';

const Unread: FC = (props) => <NotificationStatus label='Unread' bg='primary-500' {...props} />;

export default Unread;
