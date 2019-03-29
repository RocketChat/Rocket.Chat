import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { call } from '../../../ui-utils';
import { getUserPreference } from '../../../utils';
import { Rooms } from '../../../models';

import { hasPermission } from '../../../authorization';

import { settings } from '../../../settings';

import './threads.html';

export const Threads = new Mongo.Collection(null);

Template.threads.events({
	'click .message'(e) {
		const [, { hash: { msg } }] = this._arguments;
		Template.instance().mid.set(Threads.findOne(msg._id));
		e.preventDefault();
	},
});

Template.threads.helpers({
	message() {
		return Template.instance().mid.get();
	},
	loading() {
		return Template.instance().loading.get();
	},
	threads() {
		return Threads.find({ rid: this.rid }, { sort: { ts: -1 } });
	},
	room() {
		return Template.instance().room;
	},
	subscription() {
		return Template.instance().subscription;
	},
	settings() {
		const { rid } = Template.instance();

		return {
			hasPermissionDeleteMessage: hasPermission('delete-message', rid),
			hideRoles: !settings.get('UI_DisplayRoles') || getUserPreference(Meteor.userId(), 'hideRoles'),
			UI_Use_Real_Name: settings.get('UI_Use_Real_Name'),
			Chatops_Username: settings.get('Chatops_Username'),
			AutoTranslate_Enabled: settings.get('AutoTranslate_Enabled'),
			Message_AllowEditing: settings.get('Message_AllowEditing'),
			Message_AllowEditing_BlockEditInMinutes: settings.get('Message_AllowEditing_BlockEditInMinutes'),
			Message_ShowEditedStatus: settings.get('Message_ShowEditedStatus'),
			API_Embed: settings.get('API_Embed'),
			API_EmbedDisabledFor: settings.get('API_EmbedDisabledFor'),
			Message_GroupingPeriod: settings.get(''),
			allowGroup: false,
		};
	},
});

Template.threads.onCreated(async function() {
	const { rid, mid } = this.data;
	this.loading = new ReactiveVar(true);
	this.mid = new ReactiveVar(mid);
	this.room = Rooms.findOne({ _id: rid });

	const threads = await call('getThreads', { rid });

	threads.forEach((t) => Threads.insert(t));

	this.loading.set(false);
});

Template.threads.onDestroyed(function() {
	const { rid } = this.data;
	Threads.remove({ rid });
});
