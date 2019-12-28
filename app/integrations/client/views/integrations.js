import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { hasAtLeastOnePermission } from '../../../authorization';
import { integrations } from '../../lib/rocketchat';
import { SideNav } from '../../../ui-utils/client';
import { APIClient } from '../../../utils/client';

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
		return Template.instance().integrations.get();
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

Template.integrations.onCreated(async function() {
	this.integrations = new ReactiveVar([]);

	const { integrations } = await APIClient.v1.get('integrations.list');
	this.integrations.set(integrations);
});
