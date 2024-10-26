import { useContext } from 'react';

import { AppsOrchestratorContext } from '../AppsOrchestratorContext';

export const useAppsOrchestrator = () => useContext(AppsOrchestratorContext);
