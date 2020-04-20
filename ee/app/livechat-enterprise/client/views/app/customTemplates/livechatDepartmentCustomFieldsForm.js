import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { APIClient } from '../../../../../../../app/utils/client';
import './livechatDepartmentCustomFieldsForm.html';

Template.livechatDepartmentCustomFieldsForm.helpers({
	department() {
		return Template.instance().department.get();
	},
});

Template.livechatDepartmentCustomFieldsForm.onCreated(function() {
	const { id: _id, department: contextDepartment } = this.data;

	this.department = new ReactiveVar(contextDepartment);

	if (!contextDepartment && _id) {
		this.autorun(async () => {
			const { department } = await APIClient.v1.get(`livechat/department/${ _id }`);
			this.department.set(department);
		});
	}
});
