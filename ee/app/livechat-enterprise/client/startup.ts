import { Meteor } from 'meteor/meteor';

import { MultipleBusinessHoursBehavior } from './views/business-hours/Multiple';
import { settings } from '../../../../app/settings/client';
import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { IBusinessHourBehavior } from '../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';
import {
	addCustomFormTemplate,
	removeCustomTemplate,
} from '../../../../app/livechat/client/views/app/customTemplates/register';
import {
	LivechatBusinessHourBehaviors,
} from '../../../../definition/ILivechatBusinessHour';
import { EESingleBusinessHourBehaviour } from './SingleBusinessHour';

const businessHours: Record<string, IBusinessHourBehavior> = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new EESingleBusinessHourBehaviour(),
};

Meteor.startup(function() {
	settings.onload('Livechat_business_hour_type', (_, value) => {
		removeCustomTemplate('livechatBusinessHoursForm');
		removeCustomTemplate('livechatBusinessHoursTimezoneForm');
		if (LivechatBusinessHourBehaviors.MULTIPLE) {
			addCustomFormTemplate('livechatBusinessHoursForm', 'businessHoursCustomFieldsForm');
			addCustomFormTemplate('livechatBusinessHoursTimezoneForm', 'businessHoursTimezoneFormField');
		}
		businessHourManager.registerBusinessHourBehavior(businessHours[value as string]);
	});
});
