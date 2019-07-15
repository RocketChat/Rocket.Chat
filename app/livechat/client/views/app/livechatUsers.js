import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { modal, call } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import { AgentUsers } from '../../collections/AgentUsers';

import './livechatUsers.html';

let ManagerUsers;

Meteor.startup(function() {
	ManagerUsers = new Mongo.Collection('managerUsers');
});
const getUsername = (user) => user.username;
Template.livechatUsers.helpers({
	exceptionsManagers() {
		const { selectedManagers } = Template.instance();
		return ManagerUsers.find({}, { fields: { username: 1 } })
			.fetch()
			.map(getUsername)
			.concat(selectedManagers.get().map(getUsername));
	},
	exceptionsAgents() {
		const { selectedAgents } = Template.instance();
		return AgentUsers.find({}, { fields: { username: 1 } })
			.fetch()
			.map(getUsername)
			.concat(selectedAgents.get().map(getUsername));
	},
	deleteLastAgent() {
		const i = Template.instance();
		return () => {
			const arr = i.selectedAgents.curValue;
			arr.pop();
			i.selectedAgents.set(arr);
		};
	},
	deleteLastManager() {
		const i = Template.instance();
		return () => {
			const arr = i.selectedManagers.curValue;
			arr.pop();
			i.selectedManagers.set(arr);
		};
	},
	isLoading() {
		return Template.instance().state.get('loading');
	},
	managers() {
		return ManagerUsers.find({}, { sort: { name: 1 } });
	},
	agents() {
		return AgentUsers.find({}, { sort: { name: 1 } });
	},
	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	},
	agentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${
				f.length === 0
					? text
					: text.replace(
						new RegExp(filter.get()),
						(part) => `<strong>${ part }</strong>`
					)
			}`;
		};
	},
	onSelectManagers() {
		return Template.instance().onSelectManagers;
	},
	onSelectAgents() {
		return Template.instance().onSelectAgents;
	},
	selectedAgents() {
		return Template.instance().selectedAgents.get();
	},
	selectedManagers() {
		return Template.instance().selectedManagers.get();
	},
	onClickTagAgents() {
		return Template.instance().onClickTagAgents;
	},
	onClickTagManagers() {
		return Template.instance().onClickTagManagers;
	},
});

Template.livechatUsers.events({
	'click .remove-manager'(e /* , instance*/) {
		e.preventDefault();

		modal.open(
			{
				title: t('Are_you_sure'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false,
			},
			() => {
				Meteor.call('livechat:removeManager', this.username, function(
					error /* , result*/
				) {
					if (error) {
						return handleError(error);
					}
					modal.open({
						title: t('Removed'),
						text: t('Manager_removed'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				});
			}
		);
	},
	'click .remove-agent'(e /* , instance*/) {
		e.preventDefault();

		modal.open(
			{
				title: t('Are_you_sure'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false,
			},
			() => {
				Meteor.call('livechat:removeAgent', this.username, function(
					error /* , result*/
				) {
					if (error) {
						return handleError(error);
					}
					modal.open({
						title: t('Removed'),
						text: t('Agent_removed'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				});
			}
		);
	},

	async 'submit #form-manager'(e, instance) {
		e.preventDefault();
		const { selectedManagers, state } = instance;

		const users = selectedManagers.get();

		if (!users.length) {
			return;
		}

		state.set('loading', true);
		try {
			await Promise.all(
				users.map(({ username }) => call('livechat:addManager', username))
			);
			selectedManagers.set([]);
		} finally {
			state.set('loading', false);
		}
	},

	async 'submit #form-agent'(e, instance) {
		e.preventDefault();
		const { selectedAgents, state } = instance;

		const users = selectedAgents.get();

		if (!users.length) {
			return;
		}

		state.set('loading', true);
		try {
			await Promise.all(
				users.map(({ username }) => call('livechat:addAgent', username))
			);
			selectedAgents.set([]);
		} finally {
			state.set('loading', false);
		}
	},
});

Template.livechatUsers.onCreated(function() {
	this.state = new ReactiveDict({
		loading: false,
	});

	this.selectedAgents = new ReactiveVar([]);
	this.selectedManagers = new ReactiveVar([]);

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([...this.selectedAgents.curValue, agent]);
	};

	this.onClickTagAgents = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.curValue.filter((user) => user.username !== username));
	};

	this.onSelectManagers = ({ item: manager }) => {
		this.selectedManagers.set([...this.selectedManagers.curValue, manager]);
	};

	this.onClickTagManagers = ({ username }) => {
		this.selectedManagers.set(
			this.selectedManagers.curValue.filter((user) => user.username !== username)
		);
	};

	this.subscribe('livechat:agents');
	this.subscribe('livechat:managers');
});
