import { Template } from 'meteor/templating';

import './visitorEditCustomField.html';

Template.visitorEditCustomField.helpers({
	optionsList() {
		if (!this.options) {
			return [];
		}

		return this.options.split(',');
	},
	selectedField(current) {
		const { fieldData: { value } } = Template.instance();
		return value === current;
	},
});

Template.visitorEditCustomField.onCreated(function() {
	this.fieldData = Template.currentData() || {};
});
