import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';

Template.integrationsNew.helpers({
	hasPermission() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},
});
