import { useContext } from 'react';

import { AppsContext } from '../../../contexts/AppsContext';

export const useAppsOrchestration = () => useContext(AppsContext);
