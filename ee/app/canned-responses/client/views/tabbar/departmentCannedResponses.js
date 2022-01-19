import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import './departmentCannedResponses.html';

Template.departmentCannedResponses.helpers({
	departmentId() {
		return FlowRouter.getParam('_id');
	},
});

Template.departmentCannedResponses.events({});

Template.departmentCannedResponses.onCreated(function () {});
