import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type HeaderAvatarProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderAvatar = (props: HeaderAvatarProps) => <Box mi={4} display='flex' alignItems='center' {...props} />;

export default HeaderAvatar;
