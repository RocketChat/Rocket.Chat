import { useContext } from 'react';

import type { AppsContextValue } from '../AppsContext';
import { AppsContext } from '../AppsContext';

export const useAppsResult = (): AppsContextValue => useContext(AppsContext);
