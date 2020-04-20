import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './visitorForwardCustomFieldsForm.html';
import { APIClient } from '../../../../../../../app/utils/client';

Template.visitorForwardCustomFieldsForm.helpers({
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
	onSelectDepartments() {
		return Template.instance().onSelectDepartments;
	},
	departmentConditions() {
		const query = { enabled: true, numAgents: { $gt: 0 } };
		const departmentsAllowedToForward = Template.instance().departmentsAllowedToForward.get();
		if (departmentsAllowedToForward && departmentsAllowedToForward.length) {
			query._id = { $in: departmentsAllowedToForward };
		}
		return query;
	},
	selectedDepartmentsId() {
		const [department] = Template.instance().selectedDepartments.get();
		return department && department._id;
	},
});

Template.visitorForwardCustomFieldsForm.onCreated(function() {
	this.selectedAgents = new ReactiveVar([]);
	this.selectedDepartments = new ReactiveVar([]);
	this.departmentsAllowedToForward = new ReactiveVar([]);
	this.room = new ReactiveVar({});

	this.onSelectDepartments = ({ item: department }) => {
		department.text = department.name;
		this.selectedDepartments.set([department]);
		this.selectedAgents.set([]);
	};

	this.onClickTagDepartment = () => {
		this.selectedDepartments.set([]);
	};

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
		this.selectedDepartments.set([]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(async () => {
		this.room.set(this.data.get());
		if (!this.room.get()) {
			return;
		}
		const { departmentId } = this.room.get();
		if (departmentId) {
			const { department: { departmentsAllowedToForward } = {} } = await APIClient.v1.get(`livechat/department/${ departmentId }?includeAgents=false`);
			if (departmentsAllowedToForward && Array.isArray(departmentsAllowedToForward) && departmentsAllowedToForward.length) {
				this.departmentsAllowedToForward.set(departmentsAllowedToForward);
			}
		}
	});
});
