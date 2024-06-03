import { Box, Label } from '@rocket.chat/fuselage';
import ProjectsList from './ProjectsList/ProjectsList';
import { useContext } from 'react';
import { context, createNewProjectAction } from '../../Context';
import CreateNewScreenButton from '../ScreenThumbnail/CreateNewScreenButton';
import { css } from '@rocket.chat/css-in-js';

const HomeContainer = () => {
  const { dispatch } = useContext(context);
  return (
    <Box
      minWidth="100%"
      display="flex"
      justifyContent="center"
      h="var(--content-height)"
      pbs={'30px'}
    >
      <Box
        width={'max-content'}
        minWidth={'70%'}
        display="flex"
        flexDirection="column"
        className={css`
          gap: 30px;
        `}
      >
        <Label fontScale="h1">Projects</Label>
        <Label fontScale="h3">Start a new project</Label>
        <CreateNewScreenButton
          name="plus"
          onClick={() => dispatch(createNewProjectAction())}
        />
        <Label fontScale="h4">Existing Projects</Label>
        <ProjectsList />
      </Box>
    </Box>
  );
};

export default HomeContainer;
