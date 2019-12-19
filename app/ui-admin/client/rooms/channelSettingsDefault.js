import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { AdminChatRoom } from './adminRooms';
import { t, handleError } from '../../../utils';

Template.channelSettingsDefault.helpers({
	canMakeDefault() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { t: 1 } });
		return room && room.t === 'c';
	},
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	roomDefault() {
		// console.log("default", Template.instance().isDefault.get());
		return Template.instance().isDefault.get();
	},
	isFavorite() {
		return Template.instance().isFavorite.get();
	},
	defaultDescription() {
		const room = AdminChatRoom.findOne(this.rid, { fields: { default: 1 } });
		if (room && room.default) {
			return t('True');
		}
		return t('False');
	},
});

Template.channelSettingsDefault.events({
	'change input[name=default]'(e, t) {
		t.isDefault.set(e.currentTarget.value === 'true');
	},
	'change input[name=favorite]'(e, t) {
		t.isFavorite.set(e.currentTarget.checked);
	},
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

		Meteor.call('saveRoomSettings', this.rid, 'default', { default: t.isDefault.get(), favorite: t.isFavorite.get() }, (err/* , result*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(TAPi18n.__('Room_type_changed_successfully'));
		});

		t.editing.set();
	},
});

Template.channelSettingsDefault.onCreated(function() {
	this.editing = new ReactiveVar();
	this.isDefault = new ReactiveVar();
	this.isFavorite = new ReactiveVar();
	this.autorun(() => {
		const { rid } = Template.currentData();
		const room = AdminChatRoom.findOne(rid, { fields: { default: 1, favorite: 1} });
		this.isDefault.set(room && room.default);
		this.isFavorite.set(room && room.favorite);
	});
});
