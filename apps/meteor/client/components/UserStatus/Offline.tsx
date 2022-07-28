import React, { FC } from 'react';

import UserStatus from './UserStatus';

const Offline: FC = (props) => <UserStatus status='offline' {...props} />;

export default Offline;
