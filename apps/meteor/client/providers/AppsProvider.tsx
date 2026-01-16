import type { ReactNode } from 'react';

import { AppClientOrchestratorInstance } from '../apps/orchestrator';
import { AppsContext } from '../contexts/AppsContext';

type AppsProviderProps = {
	children: ReactNode;
};

const AppsProvider = ({ children }: AppsProviderProps) => {
	return <AppsContext.Provider value={AppClientOrchestratorInstance}>{children}</AppsContext.Provider>;
};

export default AppsProvider;
