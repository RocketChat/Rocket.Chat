import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './businessHoursCustomFieldsForm.html';

Template.businessHoursCustomFieldsForm.helpers({
	timezones() {
		return moment.tz.names().map((name) => ({
			key: name,
			i18nLabel: name,
		}));
	},
	data() {
		return Template.instance().businessHour.get();
	},
	active() {
		return Template.instance().active.get();
	},
	selectedOption(val) {
		const { timezone } = Template.instance().businessHour.get();
		if (!timezone) {
			return;
		}
		return timezone.name === val;
	},
});

Template.businessHoursCustomFieldsForm.events({
	'change .js-active-business-hour': (event, instance) => {
		instance.active.set(event.target.value === '1');
	},
});

Template.businessHoursCustomFieldsForm.onCreated(function() {
	this.active = new ReactiveVar(false);
	this.businessHour = new ReactiveVar({});

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		this.businessHour.set(this.data.get());
		this.active.set(this.businessHour.get().active);
	});
});
