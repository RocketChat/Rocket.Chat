import { Options } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import RoomAvatar from '../avatar/RoomAvatar';

type AvatarProps = {
	value: string;
	type: string;
	avatarETag?: string | undefined;
};

const Avatar = ({ value, type, avatarETag, ...props }: AvatarProps): ReactElement => (
	<RoomAvatar size={Options.AvatarSize} room={{ t: type, type, _id: value, avatarETag }} {...props} />
);

export default Avatar;
