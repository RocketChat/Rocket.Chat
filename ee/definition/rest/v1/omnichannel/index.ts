import type { OmnichannelBusinessHoursEndpoints } from './businessHours';
import type { OmnichannelBusinessUnitsEndpoints } from './businessUnits';
import { OmnichannelCannedResponsesEndpoints } from './cannedResponses';

export type OmnichannelEndpoints = OmnichannelBusinessHoursEndpoints &
	OmnichannelBusinessUnitsEndpoints &
	OmnichannelCannedResponsesEndpoints;
