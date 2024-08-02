import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useEffect, useContext } from 'react';

import { context, sidebarToggleAction } from '../../Context';
import ScrollableSideBar from './ScrollableSideBar';
import SliderBtn from './SliderBtn';

const SideBar: FC = () => {
  const { state, dispatch } = useContext(context);

  useEffect(() => {
    dispatch(sidebarToggleAction(false));
  }, [state?.isMobile, dispatch]);

  const slide = state?.isMobile
    ? css`
        width: 100%;
        user-select: none;
        transform: translateX(${state?.sideBarToggle ? '0' : '-100%'});
        transition: var(--animation-default);
      `
    : css`
        width: var(--sidebar-width);
        user-select: none;
        transition: var(--animation-default);
      `;

  return (
    <Box
      position={'absolute'}
      height={'100%'}
      display={'flex'}
      zIndex={4}
      bg="#fff"
      className={[slide]}
    >
      <SliderBtn />
      <ScrollableSideBar />
    </Box>
  );
};

export default SideBar;
