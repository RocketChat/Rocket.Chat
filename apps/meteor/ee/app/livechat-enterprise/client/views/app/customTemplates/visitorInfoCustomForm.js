import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { APIClient } from '../../../../../../../app/utils/client';
import './visitorInfoCustomForm.html';

Template.visitorInfoCustomForm.helpers({
	priority() {
		return Template.instance().priority.get();
	},
});

Template.visitorInfoCustomForm.onCreated(function () {
	this.priority = new ReactiveVar(null);

	this.autorun(async () => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		const { priorityId = null } = this.data.get();
		let priority;

		if (priorityId) {
			priority = await APIClient.v1.get(`livechat/priorities.getOne?priorityId=${priorityId}`);
		}

		this.priority.set(priority);
	});
});
