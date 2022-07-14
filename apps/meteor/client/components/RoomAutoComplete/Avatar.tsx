import { IRoom } from '@rocket.chat/core-typings';
import { Options } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import RoomAvatar from '../avatar/RoomAvatar';

type AvatarProps = {
	value: string;
	type: IRoom['t'];
	avatarETag?: string;
};

const Avatar: FC<AvatarProps> = ({ value, type, avatarETag, ...props }) => (
	<RoomAvatar size={Options.AvatarSize} room={{ t: type, _id: value, avatarETag }} {...props} />
);

export default Avatar;
