import { Box } from '@rocket.chat/fuselage';
import { useContext, type FC } from 'react';

import ComponentSideBar from '../Components/ComponentSideBar';
import CreateNewScreenContainer from '../Components/CreateNewScreen/CreateNewScreenContainer';
import Preview from '../Components/Preview';
import Templates from '../Components/Templates';
import { context } from '../Context';
import NavMenu from '../Components/navMenu/NavMenu';
import NavBar from '../Components/NavBar';

const Playground: FC = () => {
  const {
    state: { navMenuToggle },
  } = useContext(context);

  return (
    <>
      <NavBar />
      {navMenuToggle && <NavMenu />}
      <Box position="relative" width={'100%'} flexGrow={1}>
        <CreateNewScreenContainer />
        <Templates />
        <Box
          display={'flex'}
          width={'100%'}
          height={'100%'}
          flexDirection={'column'}
          overflow="hidden"
          bg={'var(--primaryBackgroundColor)'}
        >
          <Box width={'100%'} flexGrow={1} position={'relative'} zIndex={0}>
            <ComponentSideBar />
            <Preview />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Playground;
