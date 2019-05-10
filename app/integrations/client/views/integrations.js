import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { hasAtLeastOnePermission } from '../../../authorization';
import { integrations } from '../../lib/rocketchat';
import { ChatIntegrations } from '../collections';
import { SideNav } from '../../../ui-utils/client';

Template.integrations.helpers({
	hasPermission() {
		return hasAtLeastOnePermission([
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
			'manage-incoming-integrations',
			'manage-own-incoming-integrations',
		]);
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

Template.integrations.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
