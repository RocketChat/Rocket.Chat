import moment from 'moment';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './businessHoursTimezoneFormField.html';

Template.businessHoursTimezoneFormField.helpers({
	timezones() {
		return moment.tz.names().map((name) => ({
			key: name,
			i18nLabel: name,
		}));
	},
	selectedOption(val) {
		const { timezone } = Template.instance().businessHour.get();
		if (!timezone) {
			return;
		}
		return timezone.name === val;
	},
	data() {
		return Template.instance().businessHour.get();
	},
});

Template.businessHoursTimezoneFormField.onCreated(function() {
	this.businessHour = new ReactiveVar({});

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		this.businessHour.set(this.data.get());
	});
});
