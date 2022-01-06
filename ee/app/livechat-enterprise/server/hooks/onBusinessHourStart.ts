import { callbacks } from '../../../../../lib/callbacks';
import { MultipleBusinessHoursBehavior } from '../business-hour/Multiple';
import { settings } from '../../../../../app/settings/server';
import { LivechatBusinessHourBehaviors } from '../../../../../definition/ILivechatBusinessHour';

callbacks.add(
	'on-business-hour-start',
	(options: any = {}) => {
		const { BusinessHourBehaviorClass } = options;
		if (!BusinessHourBehaviorClass) {
			return options;
		}
		if (settings.get('Livechat_business_hour_type') === LivechatBusinessHourBehaviors.SINGLE) {
			return options;
		}
		return { BusinessHourBehaviorClass: MultipleBusinessHoursBehavior };
	},
	callbacks.priority.HIGH,
	'livechat-on-business-hour-start',
);
