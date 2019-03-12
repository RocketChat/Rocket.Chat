import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';
import { integrations } from '../../lib/rocketchat';
import { ChatIntegrations } from '../collections';
import moment from 'moment';

Template.integrations.helpers({
	hasPermission() {
		return hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},
	integrations() {
		return ChatIntegrations.find();
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	},
	eventTypeI18n(event) {
		return TAPi18n.__(integrations.outgoingEvents[event].label);
	},
});
