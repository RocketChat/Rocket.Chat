import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { APIClient, mountArrayQueryParameters } from '../../../../../../../app/utils/client';
import './livechatDepartmentCustomFieldsForm.html';

Template.livechatDepartmentCustomFieldsForm.helpers({
	department() {
		return Template.instance().department.get();
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
		const department = Template.instance().department.get();
		return [department && department._id, ...Template.instance().selectedDepartments.get().map((dept) => dept._id)];
	},
});

Template.livechatDepartmentCustomFieldsForm.onCreated(function() {
	this.selectedDepartments = new ReactiveVar([]);
	const { id: _id, department: contextDepartment } = this.data;

	this.department = new ReactiveVar(contextDepartment);
	this.onSelectDepartments = ({ item: department }) => {
		department.text = department.name;
		this.selectedDepartments.set(this.selectedDepartments.get().concat(department));
	};

	this.onClickTagDepartment = (department) => {
		this.selectedDepartments.set(this.selectedDepartments.get().filter((dept) => dept._id !== department._id));
	};

	if (!contextDepartment && _id) {
		this.autorun(async () => {
			const { department } = await APIClient.v1.get(`livechat/department/${ _id }`);
			if (department.departmentsAllowedToForward) {
				const { departments } = await APIClient.v1.get(`livechat/department.listByIds?${ mountArrayQueryParameters('ids', department.departmentsAllowedToForward) }&fields=${ JSON.stringify({ fields: { name: 1 } }) }`);
				this.selectedDepartments.set(departments.map((dept) => ({ _id: dept._id, text: dept.name })));
			}
			this.department.set(department);
		});
	}
});
