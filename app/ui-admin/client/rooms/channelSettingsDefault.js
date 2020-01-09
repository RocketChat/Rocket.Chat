import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { t, handleError } from '../../../utils';

Template.channelSettingsDefault.helpers({
	canMakeDefault() {
		const room = Template.instance().room.get();
		return room && room.t === 'c';
	},
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	roomDefault() {
		return Template.instance().isDefault.get();
	},
	isFavorite() {
		return Template.instance().isFavorite.get();
	},
	defaultDescription() {
		const { room, isDefault, isFavorite } = { room: Template.instance().room.get(), isDefault: Template.instance().isDefault.get(), isFavorite: Template.instance().isFavorite.get() };
		let description = t('False');

		if (room && isDefault) {
			description = t('True');

			if (isFavorite) {
				description += `, ${ t('Set_as_favorite') }`;
			}
			return description;
		}
		return description;
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
		Meteor.call('saveRoomSettings', t.room.get()._id, { default: t.isDefault.get(), favorite: { defaultValue: t.isDefault.get(), favorite: t.isFavorite.get() } }, (err/* , result*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(TAPi18n.__('Room_type_changed_successfully'));
		});
		t.onSuccess();
		t.editing.set();
	},
});

Template.channelSettingsDefault.onCreated(function() {
	this.editing = new ReactiveVar();
	this.isDefault = new ReactiveVar();
	this.isFavorite = new ReactiveVar();
	this.room = new ReactiveVar();
	this.onSuccess = this.data.data.onSuccess;
	this.autorun(() => {
		const { room } = Template.currentData().data;
		this.isDefault.set(room && room.default);
		this.isFavorite.set(room && room.favorite && room.default);
		this.room.set(room);
	});
});
