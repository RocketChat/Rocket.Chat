import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import _ from 'underscore';

import { hasAtLeastOnePermission } from '../../../authorization';
import { integrations } from '../../lib/rocketchat';
import { SideNav } from '../../../ui-utils/client';
import { APIClient } from '../../../utils/client';

const ITEMS_COUNT = 50;

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
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.autorun(async () => {
		const offset = this.offset.get();
		const { integrations, total } = await APIClient.v1.get(`integrations.list?count=${ ITEMS_COUNT }&offset=${ offset }`);
		this.total.set(total);
		this.integrations.set(this.integrations.get().concat(integrations));
	});
});

Template.integrations.events({
	'scroll .content': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			const integrations = instance.integrations.get();
			if (instance.total.get() <= integrations.length) {
				return;
			}
			return instance.offset.set(instance.offset.get() + ITEMS_COUNT);
		}
	}, 200),
});
