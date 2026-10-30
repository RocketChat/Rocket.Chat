import { lazy } from 'react';

import './routes';

export const SetupWizardRoute = lazy(() => import('./SetupWizardRoute'));

export { useRedirectToSetupWizard } from './hooks/useRedirectToSetupWizard';
