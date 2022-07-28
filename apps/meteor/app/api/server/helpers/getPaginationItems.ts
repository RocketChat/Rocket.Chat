// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
import { settings } from '../../../settings/server';
import { API } from '../api';

API.helperMethods.set('getPaginationItems', function _getPaginationItems(this: any) {
	const hardUpperLimitTest = settings.get<number>('API_Upper_Count_Limit');
	const defaultCountTest = settings.get<number>('API_Default_Count');

	const hardUpperLimit = hardUpperLimitTest && hardUpperLimitTest <= 0 ? 100 : settings.get<number>('API_Upper_Count_Limit');
	const defaultCount = defaultCountTest && defaultCountTest <= 0 ? 50 : settings.get<number>('API_Default_Count');
	const offset = this.queryParams.offset ? parseInt(this.queryParams.offset) : 0;
	let count = defaultCount;

	// Ensure count is an appropriate amount
	if (typeof this.queryParams.count !== 'undefined') {
		count = parseInt(this.queryParams.count);
	} else {
		count = defaultCount;
	}

	if (count > hardUpperLimit) {
		count = hardUpperLimit;
	}

	if (count === 0 && !settings.get('API_Allow_Infinite_Count')) {
		count = defaultCount;
	}

	return {
		offset,
		count,
	};
});
