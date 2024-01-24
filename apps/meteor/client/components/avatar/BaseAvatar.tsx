import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

export type BaseAvatarProps = Omit<AvatarProps, 'is'>;

const BaseAvatar: FC<BaseAvatarProps> = (props) => <Avatar aria-hidden {...props} />;

export default BaseAvatar;
