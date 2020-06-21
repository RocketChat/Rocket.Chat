import { callbacks } from '../../../../../app/callbacks/client';
import { settings } from '../../../../../app/settings/client';
import { MultipleBusinessHours } from '../views/business-hours/Multiple';

callbacks.add('on-business-hour-start', (options: any = {}) => {
	const { BusinessHourClass } = options;
	if (!BusinessHourClass) {
		return options;
	}
	if (settings.get('Livechat_business_hour_type') === 'Single') {
		return options;
	}
	return { BusinessHourClass: MultipleBusinessHours };
}, callbacks.priority.HIGH, 'livechat-on-business-hour-start');
