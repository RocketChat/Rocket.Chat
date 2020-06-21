import { callbacks } from '../../../../../app/callbacks/server';
import { MultipleBusinessHours } from '../business-hour/Multiple';
import { settings } from '../../../../../app/settings/server';

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
