import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useEffect, useContext } from 'react';

import { context, previewTabsToggleAction } from '../../Context';
import NavPanel from './NavPanel';
import Wrapper from './Wrapper';

const Preview: FC = () => {
  const {
    state: { isMobile, isTablet },
    dispatch,
  } = useContext(context);

  useEffect(() => {
    dispatch(previewTabsToggleAction(0));
  }, [isTablet, dispatch]);

  return (
    <Box
      display={'flex'}
      flexGrow={1}
      bg="#fff"
      zIndex={3}
      height={'100%'}
      flexDirection={'column'}
      pis={isMobile ? '' : 'var(--sidebar-width)'}
      className={css`
        transition: 0.5s ease;
      `}
    >
      <NavPanel />
      <Wrapper />
    </Box>
  );
};

export default Preview;
