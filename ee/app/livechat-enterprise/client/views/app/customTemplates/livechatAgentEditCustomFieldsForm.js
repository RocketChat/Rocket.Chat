import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './livechatAgentEditCustomFieldsForm.html';

Template.livechatAgentEditCustomFieldsForm.helpers({
	data() {
		const { livechat } = Template.instance().agent.get();
		return livechat;
	},
});

Template.livechatAgentEditCustomFieldsForm.onCreated(function() {
	this.agent = new ReactiveVar({});

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		this.agent.set(this.data.get());
	});
});
