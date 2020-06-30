import { Template } from 'meteor/templating';

import './livechatMainBusinessHours.html';
import { businessHourManager } from './BusinessHours';

Template.livechatMainBusinessHours.helpers({
	getTemplate() {
		return businessHourManager.getTemplate();
	},
});
