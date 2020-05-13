import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t } from '../../../../../utils';
import { hasAtLeastOnePermission, hasPermission, hasRole } from '../../../../../authorization';
import './visitorEdit.html';
import { APIClient } from '../../../../../utils/client';
import { getCustomFormTemplate } from '../customTemplates/register';

const CUSTOM_FIELDS_COUNT = 100;

Template.visitorEdit.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},

	canViewCustomFields() {
		return hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);
	},

	canOnlyViewCustomFields() {
		return hasPermission('view-livechat-room-customfields') && !hasPermission('edit-livechat-room-customfields');
	},

	visitorCustomFields() {
		const customFields = Template.instance().customFields.get();
		if (!customFields || customFields.length === 0) {
			return [];
		}

		const fields = [];
		const visitor = Template.instance().visitor.get();
		const { livechatData = {} } = visitor || {};

		customFields.forEach((field) => {
			if (field.visibility !== 'hidden' && field.scope === 'visitor') {
				const value = livechatData[field._id] ? livechatData[field._id] : '';
				fields.push({ name: field._id, label: field.label, value });
			}
		});

		return fields;
	},

	room() {
		return Template.instance().room.get();
	},

	roomCustomFields() {
		const customFields = Template.instance().customFields.get();
		if (!customFields || customFields.length === 0) {
			return [];
		}

		const fields = [];
		const room = Template.instance().room.get();
		const { livechatData = {} } = room || {};

		customFields.forEach((field) => {
			if (field.visibility !== 'hidden' && field.scope === 'room') {
				const value = livechatData[field._id] ? livechatData[field._id] : '';
				fields.push({ name: field._id, label: field.label, value });
			}
		});

		return fields;
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

	customFieldsTemplate() {
		return getCustomFormTemplate('livechatVisitorEditForm');
	},
});

Template.visitorEdit.onCreated(async function() {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.tags = new ReactiveVar([]);
	this.availableTags = new ReactiveVar([]);
	this.agentDepartments = new ReactiveVar([]);
	this.availableUserTags = new ReactiveVar([]);
	this.customFields = new ReactiveVar([]);

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
		const { customFields } = await APIClient.v1.get(`livechat/custom-fields?count=${ CUSTOM_FIELDS_COUNT }`);
		this.room.set(room);
		this.tags.set((room && room.tags) || []);
		this.customFields.set(customFields || []);
	});

	const uid = Meteor.userId();
	const { departments } = await APIClient.v1.get(`livechat/agents/${ uid }/departments`);
	const agentDepartments = departments.map((dept) => dept.departmentId);
	this.agentDepartments.set(agentDepartments);
	Meteor.call('livechat:getTagsList', (err, tagsList) => {
		this.availableTags.set(tagsList);
		const agentDepartments = this.agentDepartments.get();
		const isAdmin = hasRole(uid, ['admin', 'livechat-manager']);
		const tags = this.availableTags.get() || [];
		const availableTags = tags
			.filter(({ departments }) => isAdmin || (departments.length === 0 || departments.some((i) => agentDepartments.indexOf(i) > -1)))
			.map(({ name }) => name);
		this.availableUserTags.set(availableTags);
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
		userData.livechatData = {};
		$('[data-visitorLivechatData=true]').each(function() {
			userData.livechatData[this.name] = $(this).val() || '';
		});

		roomData.topic = event.currentTarget.elements.topic.value;
		roomData.tags = instance.tags.get();
		roomData.livechatData = {};
		$('[data-roomLivechatData=true]').each(function() {
			roomData.livechatData[this.name] = $(this).val() || '';
		});

		if (sms) {
			delete userData.phone;
		}
		instance.$('.customFormField').each((i, el) => {
			const elField = instance.$(el);
			const name = elField.attr('name');
			roomData[name] = elField.val();
		});

		Meteor.call('livechat:saveInfo', userData, roomData, (err) => {
			if (err) {
				toastr.error(t(err.error));
			} else {
				toastr.success(t('Saved'));
				this.save();
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

	'click .cancel'() {
		this.cancel();
	},
});
