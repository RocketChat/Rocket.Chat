import type { ReactNode } from 'react';

import { AppsContext } from '../contexts/AppsContext';
import { AppClientOrchestratorInstance } from '../lib/apps/orchestrator';

export type AppsProviderProps = {
	children: ReactNode;
};

const AppsProvider = ({ children }: AppsProviderProps) => {
	return <AppsContext.Provider value={AppClientOrchestratorInstance}>{children}</AppsContext.Provider>;
};

export default AppsProvider;
