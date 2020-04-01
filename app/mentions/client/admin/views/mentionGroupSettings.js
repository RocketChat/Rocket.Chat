import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { hasAllPermission } from '../../../../authorization';
import { MentionGroups, Rooms, Roles, Users } from '../../../../models';
import { SideNav, modal } from '../../../../ui-utils/client';
import { t } from '../../../../utils/client';

import './mentionGroupSettings.css';

const NEW_GROUP = {
	name: '',
	description: '',
	userCanJoin: false,
	mentionsOffline: false,
	mentionsOutside: false,
	channels: [],
	users: [],
	roles: [],
	groups: [],
};

function reactiveToObject(obj) {
	console.log(obj);
	return {
		name: obj.name.get(),
		description: obj.description.get(),
		userCanJoin: obj.userCanJoin.get(),
		mentionsOffline: obj.mentionsOffline.get(),
		mentionsOutside: obj.mentionsOutside.get(),
		users: obj.users.get().map((user) => user._id),
		channels: obj.channels.get().map((channel) => channel._id),
		roles: obj.roles.get().map((role) => role._id),
		groups: obj.groups.get().map((group) => group._id),
	};
}

Template.mentionGroupSettings.helpers({
	isEditing() {
		return Template.instance().isEditing();
	},
	group() {
		const { group } = Template.instance();
		return group;
	},
	hasPermission() {
		return hasAllPermission('manage-mention-groups');
	},
	modified(text = '') {
		const selected = Session.get('adminMentionGroupSelected');
		const group = selected ? MentionGroups.findOne(selected.gid) : NEW_GROUP;
		const { group: newGroup, selectedUsers } = Template.instance();
		const groupModified = Object.keys(group)
			.filter((key) => !key.startsWith('_') && !Array.isArray(group[key]))
			.some((key) => group[key] !== newGroup[key].get());
		const usersAdded = selectedUsers.get().length > 0;
		return !groupModified && !usersAdded ? text : '';
	},
	onUsersChanged() {
		const instance = Template.instance();
		return (users) => instance.group.users.set(users.get());
	},
	onRolesChanged() {
		const instance = Template.instance();
		return (roles) => instance.group.roles.set(roles.get());
	},
	onGroupsChanged() {
		const instance = Template.instance();
		return (groups) => instance.group.groups.set(groups.get());
	},
	onChannelsChanged() {
		const instance = Template.instance();
		return (channels) => instance.group.channels.set(channels.get());
	},
});

Template.mentionGroupSettings.onCreated(function() {
	const params = this.data.params();
	const group = !params.id ? NEW_GROUP : MentionGroups.findOne({ name: params.id });
	if (!group && params.id) {
		return FlowRouter.go('/admin/mention-groups');
	}
	const channels = Rooms.find({ _id: { $in: group.channels } }).fetch();
	const roles = Roles.find({ _id: { $in: group.roles } }).fetch();
	const groups = MentionGroups.find({ _id: { $in: group.groups } }).fetch();
	const users = Users.find({ _id: { $in: group.users } }).fetch();
	this.group = {
		_id: group._id,
		name: new ReactiveVar(group.name),
		description: new ReactiveVar(group.description),
		userCanJoin: new ReactiveVar(group.userCanJoin),
		mentionsOffline: new ReactiveVar(group.mentionsOffline),
		mentionsOutside: new ReactiveVar(group.mentionsOutside),
		channels: new ReactiveVar(channels),
		roles: new ReactiveVar(roles),
		groups: new ReactiveVar(groups),
		users: new ReactiveVar(users),
	};
	console.log(params);
	this.isEditing = () => !!params.id;
});

Template.mentionGroupSettings.onDestroyed(function() {
	Session.set('adminMentionGroupSelected', undefined);
});

Template.mentionGroupSettings.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.mentionGroupSettings.events({
	'click .js-delete'(event, instance) {
		modal.open({
			title: t('Mentions_DeleteConfirmation'),
			text: t('Mentions_DeleteConfirmationDescription'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#f5455c',
			confirmButtonText: t('Delete'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, (confirmed) => {
			if (confirmed) {
				Meteor.call('deleteMentionGroup', instance.group._id);
				FlowRouter.go('/admin/mention-groups');
			}
		});
	},
	'click .js-cancel'(event, instance) {
		console.log(instance);
		// instance.data.tabBar.close();
	},
	'click .js-reset'(event, instance) {
		instance.group.name.set('');
		instance.group.userCanJoin.set(false);
		instance.group.mentionsOffline.set(false);
	},
	'click .js-create'(event, instance) {
		Meteor.call('addMentionGroup', reactiveToObject(instance.group));
		FlowRouter.go('/admin/mention-groups');
	},
	'click .js-save'(event, instance) {
		Meteor.call('updateMentionGroup', reactiveToObject(instance.group), instance.group._id);
		FlowRouter.go('/admin/mention-groups');
	},
	'input input[type="text"]'(event, instance) {
		if (!instance.group[event.target.name]) {
			return;
		}
		instance.group[event.target.name].set(event.target.value);
	},
	'change input[type="checkbox"]'(event, instance) {
		instance.group[event.target.name].set(event.target.checked);
	},
});
