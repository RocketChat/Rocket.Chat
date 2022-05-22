import React, { FC } from 'react';

import UserStatus from './UserStatus';

const Away: FC = (props) => <UserStatus status='away' {...props} />;

export default Away;
