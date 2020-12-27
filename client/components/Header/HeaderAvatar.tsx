import React, { FC } from 'react';

import HeaderButton from './HeaderButton';

type HeaderAvatarProps = typeof HeaderButton extends FC<infer P> ? P : never;

const HeaderAvatar: FC<HeaderAvatarProps> = (props) => (
	<HeaderButton width='x36' {...props}/>
);

export default HeaderAvatar;
