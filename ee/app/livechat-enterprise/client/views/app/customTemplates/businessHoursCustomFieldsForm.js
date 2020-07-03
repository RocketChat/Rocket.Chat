import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './businessHoursCustomFieldsForm.html';

Template.businessHoursCustomFieldsForm.helpers({
	data() {
		return Template.instance().businessHour.get();
	},
	showBusinessHourActiveFormTrueChecked() {
		if (Template.instance().businessHour.get().active) {
			return 'checked';
		}
	},
	showBusinessHourActiveFormFalseChecked() {
		if (!Template.instance().businessHour.get().active) {
			return 'checked';
		}
	},
	active() {
		return Template.instance().active.get();
	},
	departmentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	onClickTagDepartment() {
		return Template.instance().onClickTagDepartment;
	},
	selectedDepartments() {
		return Template.instance().selectedDepartments.get();
	},
	selectedDepartmentsIds() {
		return Template.instance().selectedDepartments.get().map((dept) => dept._id);
	},
	onSelectDepartments() {
		return Template.instance().onSelectDepartments;
	},
	exceptionsDepartments() {
		const businessHour = Template.instance().businessHour.get();
		const exceptions = [...Template.instance().selectedDepartments.get().map((dept) => dept._id)];
		if (!businessHour || !businessHour.departments) {
			return exceptions;
		}
		return exceptions.concat(...businessHour.departments.map((dept) => dept._id));
	},
	departmentsConditions() {
		return { businessHourId: { $exists: false } };
	},
});

Template.businessHoursCustomFieldsForm.events({
	'change .js-active-business-hour': (event, instance) => {
		instance.active.set(event.target.value === '1');
	},
});

Template.businessHoursCustomFieldsForm.onCreated(function() {
	this.active = new ReactiveVar(false);
	this.businessHour = new ReactiveVar({
		active: false,
	});
	this.selectedDepartments = new ReactiveVar([]);

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		this.businessHour.set(this.data.get());
		this.active.set(this.businessHour.get().active);
		const { departments } = this.businessHour.get();
		if (departments?.length) {
			this.selectedDepartments.set(departments.map((dept) => ({
				_id: dept._id,
				text: dept.name,
			})));
		}
	});

	this.onSelectDepartments = ({ item: department }) => {
		department.text = department.name;
		this.selectedDepartments.set(this.selectedDepartments.get().concat(department));
	};

	this.onClickTagDepartment = (department) => {
		this.selectedDepartments.set(this.selectedDepartments.get().filter((dept) => dept._id !== department._id));
	};
});
