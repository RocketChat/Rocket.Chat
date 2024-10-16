import { Box, Button } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import { context, navMenuToggleAction } from '../../Context';
import BurgerIcon from './BurgerIcon';

const RightNavBtn: FC = () => {
  const { state, dispatch } = useContext(context);

  return (
    <Box
      mie="15px"
      onClick={() => state.isMobile && dispatch(navMenuToggleAction(true))}
    >
      {state.isMobile ? (
        <BurgerIcon />
      ) : (
        <Button primary>Send to RocketChat</Button>
      )}
    </Box>
  );
};

export default RightNavBtn;
