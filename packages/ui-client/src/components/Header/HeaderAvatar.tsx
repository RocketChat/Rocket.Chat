import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';

const HeaderAvatar: FC<ComponentProps<typeof Box>> = (props) => <Box mi={4} display='flex' alignItems='center' {...props} />;

export default HeaderAvatar;
