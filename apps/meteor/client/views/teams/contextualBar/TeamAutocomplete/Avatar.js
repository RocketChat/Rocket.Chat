import { Options } from '@rocket.chat/fuselage';
import React from 'react';

import RoomAvatar from '../../../../components/avatar/RoomAvatar';

const Avatar = ({ _id, type, avatarETag, ...props }) => (
	<RoomAvatar size={Options.AvatarSize} room={{ type, _id, avatarETag }} {...props} />
);

export default Avatar;
