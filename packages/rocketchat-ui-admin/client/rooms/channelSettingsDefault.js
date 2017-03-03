import toastr from 'toastr';
/* globals ChatRoom */

Template.channelSettingsDefault.helpers({
	canMakeDefault() {
		var room = ChatRoom.findOne(this.rid, { fields: { t: 1 }});
		return room && room.t === 'c';
	},
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	roomDefault() {
		var room = ChatRoom.findOne(this.rid, { fields: { default: 1 }});

		if (room) {
			return room.default;
		}
	},
	defaultDescription() {
		var room = ChatRoom.findOne(this.rid, { fields: { default: 1 }});
		if (room && room.default) {
			return t('True');
		} else {
			return t('False');
		}
	}
});

Template.channelSettingsDefault.events({
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

		Meteor.call('saveRoomSettings', this.rid, 'default', $('input[name=default]:checked').val(), (err/*, result*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(TAPi18n.__('Room_type_changed_successfully'));
		});

		t.editing.set();
	}
});

Template.channelSettingsDefault.onCreated(function() {
	this.editing = new ReactiveVar();
});
