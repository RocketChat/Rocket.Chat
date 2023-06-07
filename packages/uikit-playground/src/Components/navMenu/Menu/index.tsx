import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import SurfaceSelect from '../../SurfaceSelect';
import MenuItem from './MenuItem';
import Wrapper from './Wrapper';

const Menu: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const basicStyle = css`
    right: max(-85%, -280px);
    transition: 0.3s ease;
    box-shadow: rgb(0 0 0 / 30%) 0px 0px 15px 1px;
  `;

  const toggleStyle = isOpen
    ? css`
        transform: translateX(-100%);
      `
    : css`
        transform: translateX(0);
      `;

  return (
    <Box
      position='absolute'
      width='min(85%, 280px)'
      height='100%'
      bg='default'
      elevation='2'
      className={[basicStyle, toggleStyle]}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Wrapper>
        <Box alignSelf={'flex-start'}>
          <SurfaceSelect />
        </Box>
        <MenuItem name={'Clear Blocks'} />
        <MenuItem name={'Copy Payload'} />
        <MenuItem name={'Send to RocketChat'} />
      </Wrapper>
    </Box>
  );
};

export default Menu;
