/* eslint-disable react-hooks/exhaustive-deps */
import { Box } from '@rocket.chat/fuselage';
import { useContext, type FC, useEffect } from 'react';

import ComponentSideBar from '../Components/ComponentSideBar';
import CreateNewScreenContainer from '../Components/CreateNewScreen/CreateNewScreenContainer';
import Preview from '../Components/Preview';
import Templates from '../Components/Templates';
import { useNavigate, useParams } from 'react-router-dom';
import { activeProjectAction, context } from '../Context';
import routes from '../Routes/Routes';
import NavMenu from '../Components/navMenu/NavMenu';
import NavBar from '../Components/NavBar';

const Playground: FC = () => {
  const {
    state: { navMenuToggle, projects },
    dispatch,
  } = useContext(context);
  const { project: projectId = '' } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!projects[projectId]) navigate(routes.home);
    else dispatch(activeProjectAction(projectId));
  }, []);

  return (
    <>
      {' '}
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
