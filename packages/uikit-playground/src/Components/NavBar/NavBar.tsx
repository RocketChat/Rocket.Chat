import { css } from '@rocket.chat/css-in-js';
import { Box, Tile, Flex, ButtonGroup, Button } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

import Divider from './Divider';
import Logo from './Logo';
import RightNavBtn from './RightNavBtn';

const NabBar: FC = () => (
  <Flex.Container alignItems='center'>
    <Box
      position='relative'
      width={'100%'}
      height={'min(60px, 25vw)'}
      is={Tile}
      padding={0}
      zIndex={3}
      elevation={'2'}
      className={css`
        user-select: none;
      `}
    >
      <Logo />
      <Divider />
      <Box
        flexGrow={1}
        minWidth='15px'
        display={'flex'}
        justifyContent={'flex-end'}
      >
        <Box display='flex' height='100%'>
          <ButtonGroup
            pie={'20px'}
            className={css`
              column-gap: 5px;
            `}
          >
            <Button small>Clear Blocks</Button>
            <Button small>Copy Payload</Button>
          </ButtonGroup>
        </Box>
      </Box>
      <RightNavBtn />
    </Box>
  </Flex.Container>
);

export default NabBar;
