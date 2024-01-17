import { Options } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import React from 'react';

const Avatar = ({ _id, type, avatarETag, ...props }) => (
	<RoomAvatar size={Options.AvatarSize} room={{ type, _id, avatarETag }} {...props} />
);

export default Avatar;
