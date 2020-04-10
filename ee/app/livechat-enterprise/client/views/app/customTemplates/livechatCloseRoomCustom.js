import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { APIClient } from '../../../../../../../app/utils/client';
import { hasRole } from '../../../../../../../app/authorization';
import './livechatCloseRoomCustom.html';

Template.livechatCloseRoomCustom.helpers({
	tags() {
		return Template.instance().tags.get();
	},

	invalidTags() {
		return Template.instance().invalidTags.get();
	},

	tagsRequired() {
		return Template.instance().tagsRequired.get();
	},

	availableUserTags() {
		return Template.instance().availableUserTags.get();
	},

	tagsPlaceHolder() {
		let placeholder = TAPi18n.__('Enter_a_tag');

		const tagsRequired = Template.instance().tagsRequired.get();
		if (!tagsRequired) {
			placeholder = placeholder.concat(`(${ TAPi18n.__('Optional') })`);
		}

		return placeholder;
	},

	hasAvailableTags() {
		const tags = Template.instance().availableTags.get();
		return tags && tags.length > 0;
	},

	canRemoveTag(availableUserTags, tag) {
		return hasRole(Meteor.userId(), ['admin', 'livechat-manager']) || (Array.isArray(availableUserTags) && (availableUserTags.length === 0 || availableUserTags.indexOf(tag) > -1));
	},
});

Template.livechatCloseRoomCustom.events({
	'click .remove-tag'(e, t) {
		e.stopPropagation();
		e.preventDefault();

		const tag = this.valueOf();
		const availableTags = t.availableTags.get();
		const hasAvailableTags = availableTags && availableTags.length > 0;
		const availableUserTags = t.availableUserTags.get();
		if (!hasRole(Meteor.userId(), ['admin', 'livechat-manager']) && hasAvailableTags && (!availableUserTags || availableUserTags.indexOf(tag) === -1)) {
			return;
		}
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
});

Template.livechatCloseRoomCustom.onCreated(async function() {
	// The parent template pass a ReactiveVar through the template data
	this.tags = this.data.tags;
	this.invalidTags = this.data.invalidTags;
	this.tagsRequired = new ReactiveVar(this.data.tagsRequired);
	this.availableTags = new ReactiveVar([]);
	this.agentDepartments = new ReactiveVar([]);
	this.availableUserTags = new ReactiveVar([]);

	const uid = Meteor.userId();
	const { departments } = await APIClient.v1.get(`livechat/agents/${ uid }/departments`);
	const agentDepartments = departments.map((dept) => dept.departmentId);
	this.agentDepartments.set(agentDepartments);

	const { tags } = await APIClient.v1.get('livechat/tags.list');
	this.availableTags.set(tags);

	const isAdmin = hasRole(uid, ['admin', 'livechat-manager']);
	const availableTags = tags
		.filter(({ departments }) => isAdmin || (departments.length === 0 || departments.some((i) => agentDepartments.indexOf(i) > -1)))
		.map(({ name }) => name);

	this.availableUserTags.set(availableTags);
});
