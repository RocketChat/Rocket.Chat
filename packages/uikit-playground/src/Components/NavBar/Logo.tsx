import { Box } from '@rocket.chat/fuselage';
import { RocketChatLogo } from '@rocket.chat/logo';
import type { FC } from 'react';

const Logo: FC = () => (
  <Box
    display='flex'
    justifyContent='center'
    height='100%'
    width='var(--sidebar-width)'
  >
    <Box height='100%' width='80%'>
      <RocketChatLogo />
    </Box>
  </Box>
);

export default Logo;
