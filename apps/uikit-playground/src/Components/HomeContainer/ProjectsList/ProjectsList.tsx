import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useContext } from 'react';

import ProjectsThumbnail from './ProjectsThumbnail';
import { context } from '../../../Context';

const ProjectsList = () => {
	const {
		state: { screens, projects },
	} = useContext(context);

	return (
		<Box
			className={css`
				display: grid;
				grid-template-columns: repeat(auto-fill, 200px);
				gap: 30px;
			`}
			pbe='30px'
		>
			{Object.values(projects).map((project) => (
				<ProjectsThumbnail
					key={project.id}
					id={project.id}
					name={project.name}
					date={project.date}
					blocks={screens[project.screens[0]].payload.blocks}
				/>
			))}
		</Box>
	);
};

export default ProjectsList;
