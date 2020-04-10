import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { settings } from '../../../../../settings';
import { modal } from '../../../../../ui-utils/client';
import { APIClient, handleError, t } from '../../../../../utils';
import { getCustomFormTemplate } from '../customTemplates/register';
import './closeRoom.html';

const validateRoomComment = (comment) => {
	if (!settings.get('Livechat_request_comment_when_closing_conversation')) {
		return true;
	}

	return comment && comment.length > 0;
};

const validateRoomTags = (tagsRequired, tags) => {
	if (!tagsRequired) {
		return true;
	}

	return tags && tags.length > 0;
};

Template.closeRoom.helpers({
	invalidComment() {
		return Template.instance().invalidComment.get();
	},

	customFieldsTemplate() {
		return getCustomFormTemplate('livechatCloseRoom');
	},

	dataContext() {
		// To make the dynamic template reactive we need to pass a ReactiveVar through the data property
		// because only the dynamic template data will be reloaded
		return {
			tags: Template.instance().tags,
			invalidTags: Template.instance().invalidTags,
			tagsRequired: Template.instance().tagsRequired.get(),
		};
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

		Meteor.call('livechat:closeRoom', this.rid, comment, { clientAction: true, tags }, function(error/* , result*/) {
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
});

Template.closeRoom.onRendered(function() {
	this.find('#comment').focus();
});

Template.closeRoom.onCreated(async function() {
	this.tags = new ReactiveVar([]);
	this.invalidComment = new ReactiveVar(false);
	this.invalidTags = new ReactiveVar(false);
	this.tagsRequired = new ReactiveVar(false);

	const { rid } = Template.currentData();
	const { room } = await APIClient.v1.get(`rooms.info?roomId=${ rid }`);
	this.tags.set((room && room.tags) || []);

	if (room && room.departmentId) {
		const { department } = await APIClient.v1.get(`livechat/department/${ room.departmentId }?includeAgents=false`);
		this.tagsRequired.set(department && department.requestTagBeforeClosingChat);
	}
});
