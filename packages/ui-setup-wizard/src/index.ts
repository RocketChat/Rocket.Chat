import { lazy } from 'react';

import './routes.js';

export const SetupWizardRoute = lazy(() => import('./SetupWizardRoute.js'));

export { useRedirectToSetupWizard } from './hooks/useRedirectToSetupWizard.js';
