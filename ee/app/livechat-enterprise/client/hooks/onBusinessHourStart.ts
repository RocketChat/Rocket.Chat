import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { MultipleBusinessHours } from '../views/business-hours/MultipleBusinessHours';

callbacks.add('on-business-hour-start', (options: any = {}) => {
	const { BusinessHourClass } = options;
	if (!BusinessHourClass) {
		return options;
	}
	if (settings.get('Livechat_business_hour_type') === 'Single') {
		return options;
	}
	return { BusinessHourClass: MultipleBusinessHours };
});
