import { Options } from '@rocket.chat/fuselage';
import React from 'react';

import RoomAvatar from '../../../../client/components/avatar/RoomAvatar';

const Avatar = ({ value, type, avatarETag, ...props }) => (
	<RoomAvatar size={Options.AvatarSize} room={{ type, _id: value, avatarETag }} {...props} />
);

export default Avatar;
