import { Box, Button } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import { context } from '../../Context';
import { navMenuToggleAction } from '../../Context/action';
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
