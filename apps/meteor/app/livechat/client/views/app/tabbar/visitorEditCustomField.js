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
		const {
			fieldData: { value },
		} = Template.currentData();
		return value.trim() === current.trim();
	},
});
