import React from 'react';

import UserCard from '../../../../components/UserCard';

const Username = ({ username, status, ...props }) => <UserCard.Username name={username} status={status} {...props} />;

export default Username;
