import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t } from '../../../../../utils';
import { LivechatVisitor } from '../../../collections/LivechatVisitor';
import { LivechatRoom } from '../../../collections/LivechatRoom';
import './visitorEdit.html';

Template.visitorEdit.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},

	room() {
		return Template.instance().room.get();
	},

	email() {
		const visitor = Template.instance().visitor.get();
		if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
			return visitor.visitorEmails[0].address;
		}
	},

	phone() {
		const visitor = Template.instance().visitor.get();
		if (visitor.phone && visitor.phone.length > 0) {
			return visitor.phone[0].phoneNumber;
		}
	},

	tags() {
		return Template.instance().tags.get();
	},

	availableTags() {
		return Template.instance().availableTags.get();
	},

	hasAvailableTags() {
		const tags = Template.instance().availableTags.get();
		return tags && tags.length > 0;
	}
});

Template.visitorEdit.onRendered(function() {
	Meteor.call('livechat:getTagsList', (err, tagsList) => {
		this.availableTags.set(tagsList);
	});
});

Template.visitorEdit.onCreated(function() {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.tags = new ReactiveVar([]);
	this.availableTags = new ReactiveVar([]);

	this.autorun(() => {
		this.visitor.set(LivechatVisitor.findOne({ _id: Template.currentData().visitorId }));
	});

	this.autorun(() => {
		const room = LivechatRoom.findOne({ _id: Template.currentData().roomId });

		this.room.set(room);
		this.tags.set((room && room.tags) || []);
	});

	this.subscribe('livechat:rooms', { _id: Template.currentData().roomId });
});

Template.visitorEdit.events({
	'submit form'(event, instance) {
		event.preventDefault();
		const userData = { _id: instance.visitor.get()._id };
		const roomData = { _id: instance.room.get()._id };

		userData.name = event.currentTarget.elements.name.value;
		userData.email = event.currentTarget.elements.email.value;
		userData.phone = event.currentTarget.elements.phone.value;

		roomData.topic = event.currentTarget.elements.topic.value;
		roomData.tags = instance.tags.get();

		Meteor.call('livechat:saveInfo', userData, roomData, (err) => {
			if (err) {
				toastr.error(t(err.error));
			} else {
				toastr.success(t('Saved'));
			}
		});
	},

	'click .remove-tag'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		let tags = t.tags.get();
		tags = tags.filter((el) => el !== this.valueOf());
		t.tags.set(tags);
	},

	'click #addTag'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const tags = [...instance.tags.get()];
		const tagVal = $('#tagInput').val();
		if (tagVal !== '' && tags.indexOf(tagVal) === -1) {
			tags.push(tagVal);
			instance.tags.set(tags);
			if (!$('#tagInput').is('select')) {
				$('#tagInput').val('');
			}
		}
	},

	'click .save'() {
		this.save();
	},

	'click .cancel'() {
		this.cancel();
	},
});
