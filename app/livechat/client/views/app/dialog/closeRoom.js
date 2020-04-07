import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { settings } from '../../../../../settings';
import { call, modal } from '../../../../../ui-utils/client';
import { handleError, t } from '../../../../../utils';
import { getCustomFormTemplate } from '../customTemplates/register';
import './closeRoom.html';

const validateRoomComment = (comment) => {
	if (!settings.get('Livechat_request_comment_when_closing_conversation')) {
		return true;
	}

	return comment && comment.length > 0;
};

Template.closeRoom.helpers({
	invalidComment() {
		return Template.instance().invalidComment.get();
	},
	hasTags() {
		// return Template.instance().tags.get().filter((department) => department.enabled === true).length > 0;
		return Template.instance().tags.get();
	},
	tagsModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	onClickTag() {
		return Template.instance().onClickTag;
	},
	selectedTags() {
		return Template.instance().selectedTags.get();
	},
	onSelectTags() {
		return Template.instance().onSelectTags;
	},
	customFieldsTemplate() {
		const temp = getCustomFormTemplate('livechatCloseRoom');
		console.log(temp);
		return temp;
	},
});

Template.closeRoom.events({
	async 'submit .close-room__content'(e, instance) {
		e.preventDefault();
		e.stopPropagation();
		const comment = instance.$('#comment').val();
		instance.invalidComment.set(!validateRoomComment(comment));
		if (instance.invalidComment.get()) {
			return instance.find('#comment').focus();
		}

		Meteor.call('livechat:closeRoom', this.rid, comment, { clientAction: true }, function(error/* , result*/) {
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

Template.closeRoom.onCreated(function() {
	this.invalidComment = new ReactiveVar(false);
	this.invalidTags = new ReactiveVar(false);
	this.selectedTags = new ReactiveVar([]);

	this.onSelectTags = ({ item: tag }) => {
		tag.text = tag.name;
		const tags = this.selectedTags.get();
		if (!tags.find((t) => tags.name === t.name)) {
			this.selectedTags.set([...tags, tag]);
		}
	};

	this.onClickTag = ({ name }) => {
		this.selectedTags.set(this.selectedTags.get().filter((tag) => tag.name !== name));
	};

	this.deleteLastItemTag = () => {
		const arr = this.selectedTags.get();
		arr.pop();
		this.selectedTags.set(arr);
	};
	/*
	const { tags } = await APIClient.v1.get('livechat/tags');
	this.tags.set(tags);
	*/
});
