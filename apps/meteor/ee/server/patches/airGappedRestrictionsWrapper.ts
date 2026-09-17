import { AirGappedRestriction } from '@rocket.chat/license';

import { applyAirGappedRestrictionsValidation } from '../../../server/lib/cloud/license/airGappedRestrictionsWrapper';

applyAirGappedRestrictionsValidation.patch(async <T>(_: any, fn: () => Promise<T>): Promise<T> => {
	if (AirGappedRestriction.restricted) {
		throw new Error('restricted-workspace');
	}
	return fn();
});
