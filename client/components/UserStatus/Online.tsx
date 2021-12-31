import React, { FC } from 'react';

import UserStatus from './UserStatus';

const Online: FC = (props) => <UserStatus status='online' {...props} />;

export default Online;
