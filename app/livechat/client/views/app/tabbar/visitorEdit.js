import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t } from '../../../../../utils';
import { hasRole } from '../../../../../authorization';
import { LivechatDepartmentAgents } from '../../../collections/LivechatDepartmentAgents';
import './visitorEdit.html';
import { APIClient } from '../../../../../utils/client';

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

	availableUserTags() {
		return Template.instance().availableUserTags.get();
	},

	hasAvailableTags() {
		const tags = Template.instance().availableTags.get();
		return tags && tags.length > 0;
	},

	canRemoveTag(availableUserTags, tag) {
		return hasRole(Meteor.userId(), ['admin', 'livechat-manager']) || (Array.isArray(availableUserTags) && (availableUserTags.length === 0 || availableUserTags.indexOf(tag) > -1));
	},

	isSmsIntegration() {
		const room = Template.instance().room.get();
		return !!(room && room.sms);
	},
});

Template.visitorEdit.onRendered(function() {
	Meteor.call('livechat:getTagsList', (err, tagsList) => {
		this.availableTags.set(tagsList);

		const uid = Meteor.userId();
		const agentDepartments = this.agentDepartments.get();
		const isAdmin = hasRole(uid, ['admin', 'livechat-manager']);
		const tags = this.availableTags.get() || [];
		const availableTags = tags
			.filter(({ departments }) => isAdmin || (departments.length === 0 || departments.some((i) => agentDepartments.indexOf(i) > -1)))
			.map(({ name }) => name);

		this.availableUserTags.set(availableTags);
	});
});

Template.visitorEdit.onCreated(function() {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.tags = new ReactiveVar([]);
	this.availableTags = new ReactiveVar([]);
	this.agentDepartments = new ReactiveVar([]);
	this.availableUserTags = new ReactiveVar([]);

	this.autorun(async () => {
		const { visitorId } = Template.currentData();
		if (visitorId) {
			const { visitor } = await APIClient.v1.get(`livechat/visitors.info?visitorId=${ visitorId }`);
			this.visitor.set(visitor);
		}
	});

	const rid = Template.currentData().roomId;

	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ rid }`);
		this.room.set(room);
		this.tags.set((room && room.tags) || []);
	});

	const uid = Meteor.userId();
	this.subscribe('livechat:departmentAgents', null, uid, () => {
		const departments = [];
		LivechatDepartmentAgents.find({ agentId: uid }).forEach((dept) => {
			departments.push(dept.departmentId);
		});
		this.agentDepartments.set(departments);
	});
});

Template.visitorEdit.events({
	'submit form'(event, instance) {
		event.preventDefault();
		const userData = { _id: instance.visitor.get()._id };

		const room = instance.room.get();
		const { _id, sms } = room;
		const roomData = { _id };

		userData.name = event.currentTarget.elements.name.value;
		userData.email = event.currentTarget.elements.email.value;
		userData.phone = event.currentTarget.elements.phone.value;

		roomData.topic = event.currentTarget.elements.topic.value;
		roomData.tags = instance.tags.get();

		if (sms) {
			delete userData.phone;
		}

		Meteor.call('livechat:saveInfo', userData, roomData, (err) => {
			if (err) {
				toastr.error(t(err.error));
			} else {
				toastr.success(t('Saved'));
			}
		});
	},

	'click .remove-tag'(e, t) {
		const tag = this.valueOf();
		const availableTags = t.availableTags.get();
		const hasAvailableTags = availableTags && availableTags.length > 0;
		const availableUserTags = t.availableUserTags.get();
		if (!hasRole(Meteor.userId(), ['admin', 'livechat-manager']) && hasAvailableTags && (!availableUserTags || availableUserTags.indexOf(tag) === -1)) {
			return;
		}
		e.stopPropagation();
		e.preventDefault();
		let tags = t.tags.get();
		tags = tags.filter((el) => el !== tag);
		t.tags.set(tags);
	},

	'click #addTag'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		if ($('#tagSelect').find(':selected').is(':disabled')) {
			return;
		}

		const tags = [...instance.tags.get()];
		const tagVal = $('#tagSelect').val();
		if (tagVal === '' || tags.indexOf(tagVal) > -1) {
			return;
		}

		tags.push(tagVal);
		instance.tags.set(tags);
		$('#tagSelect').val('placeholder');
	},

	'keydown #tagInput'(e, instance) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();

			const tags = [...instance.tags.get()];
			const tagVal = $('#tagInput').val();
			if (tagVal === '' || tags.indexOf(tagVal) > -1) {
				return;
			}

			tags.push(tagVal);
			instance.tags.set(tags);
			$('#tagInput').val('');
		}
	},

	'click .save'() {
		this.save();
	},

	'click .cancel'() {
		this.cancel();
	},
});
