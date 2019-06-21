import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { modal, call } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import { AgentUsers } from '../../collections/AgentUsers';

import './livechatAgents.html';

const getUsername = (user) => user.username;
Template.livechatAgents.helpers({
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
	isLoading() {
		return Template.instance().state.get('loading');
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
	onSelectAgents() {
		return Template.instance().onSelectAgents;
	},
	selectedAgents() {
		return Template.instance().selectedAgents.get();
	},
	onClickTagAgents() {
		return Template.instance().onClickTagAgents;
	},
});

Template.livechatAgents.events({
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

Template.livechatAgents.onCreated(function() {
	this.state = new ReactiveDict({
		loading: false,
	});

	this.selectedAgents = new ReactiveVar([]);

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([...this.selectedAgents.curValue, agent]);
	};

	this.onClickTagAgents = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.curValue.filter((user) => user.username !== username));
	};

	this.subscribe('livechat:agents');
});
