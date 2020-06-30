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
import { hasLicense } from '../../license/client';

const businessHours: Record<string, IBusinessHourBehavior> = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new EESingleBusinessHourBehaviour(),
};

Meteor.startup(function() {
	settings.onload('Livechat_business_hour_type', async (_, value) => {
		removeCustomTemplate('livechatBusinessHoursForm');
		removeCustomTemplate('livechatBusinessHoursTimezoneForm');
		addCustomFormTemplate('livechatBusinessHoursTimezoneForm', 'businessHoursTimezoneFormField');
		if (LivechatBusinessHourBehaviors.MULTIPLE) {
			addCustomFormTemplate('livechatBusinessHoursForm', 'businessHoursCustomFieldsForm');
		}
		if (await hasLicense('livechat-enterprise')) {
			businessHourManager.registerBusinessHourBehavior(businessHours[value as string]);
		}
	});
});
