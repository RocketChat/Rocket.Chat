import React, { FC } from 'react';

import NotificationStatus from './NotificationStatus';

const Me: FC = (props) => <NotificationStatus label='Me' bg='danger-500' {...props} />;

export default Me;
