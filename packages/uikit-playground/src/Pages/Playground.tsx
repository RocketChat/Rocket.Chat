import { Box } from '@rocket.chat/fuselage';
import { useMediaQueries } from '@rocket.chat/fuselage-hooks';
import type { FC } from 'react';
import { useEffect, useContext } from 'react';

import ComponentSideBar from '../Components/ComponentSideBar';
import NavBar from '../Components/NavBar';
import Preview from '../Components/Preview';
import NavMenu from '../Components/navMenu';
import { context } from '../Context';
import { isMobileAction, isTabletAction } from '../Context/action';

const Playground: FC = () => {
  const {
    state: { navMenuToggle },
    dispatch,
  } = useContext(context);

  const [isMobile, isTablet] = useMediaQueries(
    '(max-width: 500px)',
    '(max-width: 1050px)'
  );

  useEffect(() => {
    dispatch(isMobileAction(isMobile));
  }, [isMobile, dispatch]);

  useEffect(() => {
    dispatch(isTabletAction(isTablet));
  }, [isTablet, dispatch]);

  return (
    <Box
      display={'flex'}
      width={'100%'}
      height={'100%'}
      flexDirection={'column'}
      overflow='hidden'
      bg={'var(--primaryBackgroundColor)'}
    >
      <NavBar />
      {navMenuToggle && <NavMenu />}
      <Box width={'100%'} flexGrow={1} position={'relative'} zIndex={0}>
        <ComponentSideBar />
        <Preview />
      </Box>
    </Box>
  );
};

export default Playground;
