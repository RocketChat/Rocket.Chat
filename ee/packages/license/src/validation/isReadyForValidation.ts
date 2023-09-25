import { getWorkspaceUrl } from '../workspaceUrl';
import { hasAllDataCounters } from './getCurrentValueForLicenseLimit';

// Can only validate licenses once the workspace URL and the data counter functions are set
export const isReadyForValidation = () => Boolean(getWorkspaceUrl() && hasAllDataCounters());
