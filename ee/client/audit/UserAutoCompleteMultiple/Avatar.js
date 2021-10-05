import { Options } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../../../../client/components/avatar/UserAvatar';

const Avatar = ({ value, ...props }) => (
	<UserAvatar size={Options.AvatarSize} username={value} {...props} />
);

export default Avatar;
