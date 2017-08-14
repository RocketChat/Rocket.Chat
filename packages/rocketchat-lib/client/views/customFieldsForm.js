Template.customFieldsForm.helpers({
	new() {
		return this.new;
	},
	customFields() {
		const customFields = Template.instance().customFields.get();

		if (!customFields) {
			return [];
		}

		const customFieldsArray = [];

		Object.keys(customFields).forEach((key) => {
			const value = customFields[key];
			if (value.hideFromForm === true && Template.instance().hideFromForm === true) {
				return;
			}
			customFieldsArray.push({
				fieldName: key,
				field: value
			});
		});

		return customFieldsArray;
	},
	selectedField(current, field) {
		const formData = Template.instance().formData;

		if (typeof formData[field.fieldName] !== 'undefined') {
			return formData[field.fieldName] === current;
		} else if (typeof field.defaultValue !== 'undefined') {
			return field.defaultValue === current;
		}
	},
	fieldValue() {
		const formData = Template.instance().formData;

		return formData[this.fieldName];
	}
});

Template.customFieldsForm.onCreated(function() {
	this.customFields = new ReactiveVar();

	const currentData = Template.currentData();
	this.hideFromForm = currentData && currentData.hideFromForm;
	this.formData = (currentData && currentData.formData) || {};

	Tracker.autorun(() => {
		const Accounts_CustomFields = RocketChat.settings.get('Accounts_CustomFields');
		if (typeof Accounts_CustomFields === 'string' && Accounts_CustomFields.trim() !== '') {
			try {
				this.customFields.set(JSON.parse(RocketChat.settings.get('Accounts_CustomFields')));
			} catch (e) {
				console.error('Invalid JSON for Accounts_CustomFields');
			}
		} else {
			this.customFields.set(undefined);
		}
	});
});
