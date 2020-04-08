import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './visitorRoomInfo.html';

Template.customVisitorRoomInfo.helpers({
	priority() {
		return Template.instance().priority.get();
	},
});

Template.customVisitorRoomInfo.onCreated(function() {
	this.priority = new ReactiveVar(null);

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		const { omnichannel: { priority = null } = {} } = this.data.get();
		this.priority.set(priority);
	});
});
