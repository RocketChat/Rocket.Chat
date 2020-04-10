import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import './livechatAgentInfoCustomFieldsForm.html';

Template.livechatAgentInfoCustomFieldsForm.helpers({
	data() {
		const { livechat: { maxNumberSimultaneousChat } = {} } = Template.instance().agent.get();
		return {
			maxNumberSimultaneousChat: maxNumberSimultaneousChat || TAPi18n.__('Undefined'),
		};
	},
});

Template.livechatAgentInfoCustomFieldsForm.onCreated(function() {
	this.agent = new ReactiveVar({});

	this.autorun(() => {
		// To make this template reactive we expect a ReactiveVar through the data property,
		// because the parent form may not be rerender, only the dynamic template data
		this.agent.set(this.data.get());
	});
});
