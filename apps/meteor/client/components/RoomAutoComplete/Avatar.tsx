import { Options } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

import RoomAvatar from '../avatar/RoomAvatar';

type AvatarProps = {
	value: string;
	type: string;
	avatarETag?: string;
};

const Avatar: FC<AvatarProps> = ({ value, type, avatarETag, ...props }) => (
	<RoomAvatar size={Options.AvatarSize} room={{ type, _id: value, avatarETag }} {...props} />
);

export default Avatar;
