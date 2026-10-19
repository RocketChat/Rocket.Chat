import { LivechatBusinessHourBehaviors } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../server/lib/callbacks';
import type { IBusinessHourBehavior } from '../../../../server/lib/omnichannel/business-hour/AbstractBusinessHour';
import { settings } from '../../../../server/settings';
import { MultipleBusinessHoursBehavior } from '../../lib/omnichannel/business-hour/Multiple';

callbacks.add(
	'on-business-hour-start',
	(options: { BusinessHourBehaviorClass?: { new (): IBusinessHourBehavior } } = {}) => {
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
