import React, { FC } from 'react';

import UserStatus from './UserStatus';

const Busy: FC = (props) => <UserStatus status='busy' {...props} />;

export default Busy;
