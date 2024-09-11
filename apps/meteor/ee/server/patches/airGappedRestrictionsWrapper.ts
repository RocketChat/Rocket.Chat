import { applyAirGappedRestrictionsValidation } from '../../../app/license/server/airGappedRestrictionsWrapper';
import { settings } from '../../../app/settings/server';

applyAirGappedRestrictionsValidation.patch(async <T>(_: any, fn: () => Promise<T>): Promise<T> => {
	if (settings.get<number>('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days') === 0) {
		throw new Error('restricted-workspace');
	}
	return fn();
});
