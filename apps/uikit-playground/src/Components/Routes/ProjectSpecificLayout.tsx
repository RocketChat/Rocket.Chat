import { useContext, useEffect } from 'react';
import { useNavigate, useOutlet, useParams } from 'react-router-dom';

import { activeProjectAction, context } from '../../Context';
import routes from '../../Routes/Routes';

export const ProjectSpecificLayout = () => {
	const {
		state: { projects },
		dispatch,
	} = useContext(context);
	const { projectId } = useParams();
	const navigate = useNavigate();
	const outlet = useOutlet();

	useEffect(() => {
		if (!projectId || !projects[projectId]) navigate(routes.home);
		else dispatch(activeProjectAction(projectId));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <>{outlet}</>;
};
