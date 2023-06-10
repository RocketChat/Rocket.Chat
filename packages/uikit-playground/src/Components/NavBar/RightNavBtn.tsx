import { Box, Button } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useContext } from 'react';

import { context, navMenuToggleAction } from '../../Context';
import BurgerIcon from './BurgerIcon';

const RightNavBtn: FC = () => {
  const {
    state: { isMobile },
    dispatch,
  } = useContext(context);

  return (
    <Box
      mie='15px'
      onClick={() => isMobile && dispatch(navMenuToggleAction(true))}
    >
      {isMobile ? <BurgerIcon /> : <Button primary>Send to RocketChat</Button>}
    </Box>
  );
};

export default RightNavBtn;
