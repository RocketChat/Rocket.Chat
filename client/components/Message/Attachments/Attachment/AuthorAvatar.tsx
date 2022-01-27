import { Avatar } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const AuthorAvatar: FC<{ url: string }> = ({ url }) => <Avatar {...({ url, size: 'x24' } as any)} />;

export default AuthorAvatar;
