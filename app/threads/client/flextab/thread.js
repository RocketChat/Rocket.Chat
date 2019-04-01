import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { call } from '../../../ui-utils';
import { getUserPreference } from '../../../utils';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { Messages } from '../../../models';

import './thread.html';

export const Threads = new Mongo.Collection(null);

Template.thread.events({
	'click .js-close'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { close } = this;
		return close && close();
	},
});

Template.thread.helpers({
	user() {
		return Meteor.user();
	},
	loading() {
		return Template.instance().loading.get();
	},
	messages() {
		return Threads.find({ tmid: this.mainMessage._id }, { sort: { ts: 1 } });
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
			Message_GroupingPeriod: settings.get('Message_GroupingPeriod'),
		};
	},
});

Template.thread.onCreated(async function() {

	const { room, mainMessage } = this.data;
	this.loading = new ReactiveVar(true);

	this.room = room;

	const messages = await call('getThreadMessages', { tmid: mainMessage._id });

	messages.forEach((t) => Threads.insert(t));

	this.loading.set(false);


	this.threadsObserve = Messages.find({ tmid: mainMessage._id }).observe({
		added: ({ _id, ...message }) => {
			Threads.upsert({ _id }, message);
		}, // Update message to re-render DOM
		changed: ({ _id, ...message }) => {
			Threads.update({ _id }, message);
		}, // Update message to re-render DOM
		// removed: (role) => {
		// 	if (!role.u || !role.u._id) {
		// 		return;
		// 	}
		// 	ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
		// },
	});
});

Template.thread.onDestroyed(function() {
	const { mainMessage } = this.data;
	this.threadsObserve.stop();
	Threads.remove({ tmid: mainMessage._id });
	Threads.remove({ _id: mainMessage._id });
});
