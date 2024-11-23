import { useContext } from 'react';

import { AppsContext } from '../../../contexts/AppsContext';

export const useAppsOrchestration = () => {
	const { orchestrator } = useContext(AppsContext);

	return orchestrator;
};
