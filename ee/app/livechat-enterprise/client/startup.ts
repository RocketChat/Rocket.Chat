import { Meteor } from 'meteor/meteor';

import { MultipleBusinessHoursBehavior } from './views/business-hours/Multiple';
import { SingleBusinessHourBehavior } from '../../../../app/livechat/client/views/app/business-hours/Single';
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

const businessHours: Record<string, IBusinessHourBehavior> = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new SingleBusinessHourBehavior(),
};

Meteor.startup(function() {
	settings.onload('Livechat_business_hour_type', (_, value) => {
		removeCustomTemplate('livechatBusinessHoursForm');
		if (LivechatBusinessHourBehaviors.MULTIPLE) {
			addCustomFormTemplate('livechatBusinessHoursForm', 'businessHoursCustomFieldsForm');
		}
		businessHourManager.registerBusinessHourBehavior(businessHours[value as string]);
	});
});
