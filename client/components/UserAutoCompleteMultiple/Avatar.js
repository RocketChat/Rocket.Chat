import { Options } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../avatar/UserAvatar';

const Avatar = ({ value, ...props }) => (
	<UserAvatar size={Options.AvatarSize} username={value} {...props} />
);

export default Avatar;
