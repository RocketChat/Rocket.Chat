import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type HeaderAvatarProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderAvatar = (props: HeaderAvatarProps) => <Box marginInline={4} display='flex' alignItems='center' {...props} />;

export default HeaderAvatar;
