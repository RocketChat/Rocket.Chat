import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../../../settings';
import { modal } from '../../../../../ui-utils/client';
import { APIClient, t } from '../../../../../utils';
import { hasAnyRole } from '../../../../../authorization';
import './closeRoom.html';
import { handleError } from '../../../../../../client/lib/utils/handleError';

const validateRoomComment = (comment) => {
	if (!settings.get('Livechat_request_comment_when_closing_conversation')) {
		return true;
	}

	return comment?.length > 0;
};

const validateRoomTags = (tagsRequired, tags) => {
	if (!tagsRequired) {
		return true;
	}

	return tags?.length > 0;
};

const checkUserTagPermission = (availableUserTags = [], tag) => {
	if (hasAnyRole(Meteor.userId(), ['admin', 'livechat-manager'])) {
		return true;
	}

	return availableUserTags.includes(tag);
};

Template.closeRoom.helpers({
	invalidComment() {
		return Template.instance().invalidComment.get();
	},
	tags() {
		return Template.instance().tags.get();
	},
	invalidTags() {
		return Template.instance().invalidTags.get();
	},
	availableUserTags() {
		return Template.instance().availableUserTags.get();
	},
	tagsPlaceHolder() {
		let placeholder = TAPi18n.__('Enter_a_tag');

		if (!Template.instance().tagsRequired.get()) {
			placeholder = placeholder.concat(`(${TAPi18n.__('Optional')})`);
		}

		return placeholder;
	},
	hasAvailableTags() {
		const tags = Template.instance().availableTags.get();
		return tags?.length > 0;
	},
	canRemoveTag(availableUserTags, tag) {
		return checkUserTagPermission(availableUserTags, tag);
	},
});

Template.closeRoom.events({
	async 'submit .close-room__content'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		const comment = instance.$('#comment').val();
		instance.invalidComment.set(!validateRoomComment(comment));
		if (instance.invalidComment.get()) {
			return;
		}

		const tagsRequired = instance.tagsRequired.get();
		const tags = instance.tags.get();

		instance.invalidTags.set(!validateRoomTags(tagsRequired, tags));
		if (instance.invalidTags.get()) {
			return;
		}

		Meteor.call('livechat:closeRoom', this.rid, comment, { clientAction: true, tags }, function (error /* , result*/) {
			if (error) {
				console.log(error);
				return handleError(error);
			}

			modal.open({
				title: t('Chat_closed'),
				text: t('Chat_closed_successfully'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false,
			});
		});
	},
	'click .remove-tag'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		const tag = this.valueOf();
		const availableTags = instance.availableTags.get();
		const hasAvailableTags = availableTags?.length > 0;
		const availableUserTags = instance.availableUserTags.get();
		if (hasAvailableTags && !checkUserTagPermission(availableUserTags, tag)) {
			return;
		}

		let tags = instance.tags.get();
		tags = tags.filter((el) => el !== tag);
		instance.tags.set(tags);
	},
	'click #addTag'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		if ($('#tagSelect').find(':selected').is(':disabled')) {
			return;
		}

		const tags = [...instance.tags.get()];
		const tagVal = $('#tagSelect').val();
		if (tagVal === '' || tags.includes(tagVal)) {
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
			if (tagVal === '' || tags.includes(tagVal)) {
				return;
			}

			tags.push(tagVal);
			instance.tags.set(tags);
			$('#tagInput').val('');
		}
	},
});

Template.closeRoom.onRendered(function () {
	this.find('#comment').focus();
});

Template.closeRoom.onCreated(async function () {
	this.tags = new ReactiveVar([]);
	this.invalidComment = new ReactiveVar(false);
	this.invalidTags = new ReactiveVar(false);
	this.tagsRequired = new ReactiveVar(false);
	this.availableTags = new ReactiveVar([]);
	this.availableUserTags = new ReactiveVar([]);
	this.agentDepartments = new ReactiveVar([]);

	this.onEnterTag = () => this.invalidTags.set(!validateRoomTags(this.tagsRequired.get(), this.tags.get()));

	const { rid } = Template.currentData();
	const { room } = await APIClient.v1.get(`rooms.info?roomId=${rid}`);
	this.tags.set(room?.tags || []);

	if (room?.departmentId) {
		const { department } = await APIClient.v1.get(`livechat/department/${room.departmentId}?includeAgents=false`);
		this.tagsRequired.set(department?.requestTagBeforeClosingChat);
	}

	const uid = Meteor.userId();
	const { departments } = await APIClient.v1.get(`livechat/agents/${uid}/departments`);
	const agentDepartments = departments.map((dept) => dept.departmentId);
	this.agentDepartments.set(agentDepartments);

	Meteor.call('livechat:getTagsList', (err, tagsList) => {
		this.availableTags.set(tagsList);
		const isAdmin = hasAnyRole(uid, ['admin', 'livechat-manager']);
		const availableTags = tagsList
			.filter(({ departments }) => isAdmin || departments.length === 0 || departments.some((i) => agentDepartments.includes(i)))
			.map(({ name }) => name);
		this.availableUserTags.set(availableTags);
	});
});
