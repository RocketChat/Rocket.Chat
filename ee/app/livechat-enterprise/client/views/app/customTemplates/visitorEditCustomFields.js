import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { APIClient } from '../../../../../../../app/utils/client';
import './visitorEditCustomFields.html';

Template.visitorEditCustomFields.helpers({
	availablePriorities() {
		return Template.instance().priorities.get();
	},
	roomPriority() {
		return Template.instance().roomPriority.get();
	},
	showPriorities() {
		return Template.instance().priorities.get().length > 0;
	},
});

Template.visitorEditCustomFields.onCreated(async function() {
	this.priorities = new ReactiveVar([]);
	this.roomPriority = new ReactiveVar({});
	const { omnichannel } = this.data;

	if (omnichannel && omnichannel.priority) {
		this.roomPriority.set(omnichannel.priority);
	}
	const { priorities } = await APIClient.v1.get('livechat/priorities.list');
	this.priorities.set(priorities);
});
