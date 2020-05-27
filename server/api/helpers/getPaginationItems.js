// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
import { settings } from '../../../app/settings';
import { API } from '../api';

API.helperMethods.set('getPaginationItems', function _getPaginationItems() {
	const hardUpperLimit = settings.get('API_Upper_Count_Limit') <= 0 ? 100 : settings.get('API_Upper_Count_Limit');
	const defaultCount = settings.get('API_Default_Count') <= 0 ? 50 : settings.get('API_Default_Count');
	const offset = this.queryParams.offset ? parseInt(this.queryParams.offset) : 0;
	let count = defaultCount;

	// Ensure count is an appropiate amount
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
