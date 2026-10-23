import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useContext } from 'react';

import ProjectsList from './ProjectsList/ProjectsList';
import { context, createNewProjectAction } from '../../Context';
import CreateNewScreenButton from '../ScreenThumbnail/CreateNewScreenButton';

const HomeContainer = () => {
	const { dispatch } = useContext(context);
	return (
		<Box minWidth='100%' display='flex' justifyContent='center' height='var(--content-height)' paddingBlockStart='x32'>
			<Box
				width='max-content'
				minWidth='70%'
				display='flex'
				flexDirection='column'
				className={css`
					gap: 30px;
				`}
			>
				<Box fontScale='h1'>Projects</Box>
				<Box fontScale='h3'>Start a new project</Box>
				<CreateNewScreenButton name='plus' onClick={() => dispatch(createNewProjectAction())} />
				<Box fontScale='h4'>Existing Projects</Box>
				<ProjectsList />
			</Box>
		</Box>
	);
};

export default HomeContainer;
