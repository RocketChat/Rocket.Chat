import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import ComponentSideBar from '../Components/ComponentSideBar';
import CreateNewScreenContainer from '../Components/CreateNewScreen/CreateNewScreenContainer';
import Preview from '../Components/Preview';
import Templates from '../Components/Templates';

const Playground: FC = () => {
  return (
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
  );
};

export default Playground;
