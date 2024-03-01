import { Options } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { FC } from 'react';

type AvatarProps = {
	value: string;
	type: string;
	avatarETag?: string;
};

const Avatar: FC<AvatarProps> = ({ value, type, avatarETag, ...props }) => (
	<RoomAvatar size={Options.AvatarSize} room={{ type, _id: value, avatarETag }} {...props} />
);

export default Avatar;
