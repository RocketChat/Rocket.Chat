import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HeaderAvatarProps = { children?: ReactNode };

const HeaderAvatar = ({ children }: HeaderAvatarProps) => (
	<Box marginInline={4} display='flex' alignItems='center'>
		{children}
	</Box>
);

export default HeaderAvatar;
