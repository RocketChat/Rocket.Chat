import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import s from 'underscore.string';
import _ from 'underscore';

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
		return Template.instance().agents();
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
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (
				currentTarget.offsetHeight + currentTarget.scrollTop
				>= currentTarget.scrollHeight - 100
			) {
				return instance.limit.set(instance.limit.get() + 50);
			}
		};
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
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.state = new ReactiveDict({
		loading: false,
	});
	this.ready = new ReactiveVar(true);
	this.selectedAgents = new ReactiveVar([]);

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([...this.selectedAgents.curValue, agent]);
	};

	this.onClickTagAgents = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.curValue.filter((user) => user.username !== username));
	};

	this.autorun(function() {
		const filter = instance.filter.get();
		const limit = instance.limit.get();
		const subscription = instance.subscribe('livechat:agents', filter, limit);
		instance.ready.set(subscription.ready());
	});
	this.agents = function() {
		let filter;
		let query = {};

		if (instance.filter && instance.filter.get()) {
			filter = s.trim(instance.filter.get());
		}

		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { $or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }] };
		}

		const limit = instance.limit && instance.limit.get();
		return AgentUsers.find(query, { limit, sort: { name: 1 } }).fetch();
	};
});

const DEBOUNCE_TIME_FOR_SEARCH_AGENTS_IN_MS = 300;

Template.livechatAgents.events({
	'keydown #agents-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #agents-filter': _.debounce((e, t) => {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	}, DEBOUNCE_TIME_FOR_SEARCH_AGENTS_IN_MS),
	/*
	'click .agent-info'(e, instance) {
		e.preventDefault();
		instance.tabBarData.set(FullUser.findOne(this._id));
		instance.tabBar.open('admin-user-info');
	},
	'click .info-tabs button'(e) {
		e.preventDefault();
		$('.info-tabs button').removeClass('active');
		$(e.currentTarget).addClass('active');
		$('.user-info-content').hide();
		$($(e.currentTarget).attr('href')).show();
	},
	*/
});
