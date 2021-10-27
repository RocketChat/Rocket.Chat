import type { OmnichannelBusinessHoursEndpoints } from './businessHours';
import type { OmnichannelBusinessUnitsEndpoints } from './businessUnits';

export type OmnichannelEndpoints = OmnichannelBusinessHoursEndpoints &
	OmnichannelBusinessUnitsEndpoints;
