import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import './channelSettingsFeatured.html';

import { t, handleError } from '../../../utils';

Template.channelSettingsFeatured.helpers({
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	roomFeatured() {
		const room = Template.instance().room.get();

		if (room) {
			return room.featured;
		}
	},
	featuredDescription() {
		const room = Template.instance().room.get();
		if (room && room.featured) {
			return t('True');
		}
		return t('False');
	},
});

Template.channelSettingsFeatured.events({
	'click [data-edit]'(e, t) {
		e.preventDefault();
		t.editing.set($(e.currentTarget).data('edit'));
		setTimeout(() => {
			t.$('input.editing').focus().select();
		}, 100);
	},
	'click .cancel'(e, t) {
		e.preventDefault();
		t.editing.set();
	},
	'click .save'(e, t) {
		e.preventDefault();

		Meteor.call('saveRoomSettings', Template.instance().room.get()._id, 'featured', $('input[name=featured]:checked').val(), (err/* , result*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(TAPi18n.__('Room_changed_successfully'));
		});
		t.onSuccess();
		t.editing.set();
	},
});

Template.channelSettingsFeatured.onCreated(function() {
	this.editing = new ReactiveVar();
	this.room = new ReactiveVar();
	this.onSuccess = Template.currentData().onSuccess;

	this.autorun(() => {
		const { room } = Template.currentData();
		this.room.set(room);
	});
});
