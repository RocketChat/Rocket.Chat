import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';

const Avatar = ({ username, ...props }) => <UserAvatar title={username} username={username} {...props} />;

export default Avatar;
