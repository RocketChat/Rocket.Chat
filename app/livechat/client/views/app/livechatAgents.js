import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import s from 'underscore.string';
import _ from 'underscore';

import { modal, call, RocketChatTabBar } from '../../../../ui-utils';
import { t, handleError, APIClient } from '../../../../utils/client';
import './livechatAgents.html';

const loadAgents = async (instance, limit = 50) => {
	const { users } = await APIClient.v1.get(`livechat/users/agent?count=${ limit }`);
	instance.agents.set(users);
	instance.ready.set(true);
};

const getUsername = (user) => user.username;
Template.livechatAgents.helpers({
	exceptionsAgents() {
		const { selectedAgents } = Template.instance();
		return Template.instance().agents.get()
			.map(getUsername).concat(selectedAgents.get().map(getUsername));
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
		return Template.instance().getAgentsWithCriteria();
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
	flexData() {
		console.log('a');
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
});

const DEBOUNCE_TIME_FOR_SEARCH_AGENTS_IN_MS = 300;

Template.livechatAgents.events({
	'click .remove-agent'(e, instance) {
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
				Meteor.call('livechat:removeAgent', this.username, async function(
					error /* , result*/
				) {
					if (error) {
						return handleError(error);
					}
					await loadAgents(instance);
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
			await loadAgents(instance);
			selectedAgents.set([]);
		} finally {
			state.set('loading', false);
		}
	},

	'keydown #agents-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #agents-filter': _.debounce((e, t) => {
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	}, DEBOUNCE_TIME_FOR_SEARCH_AGENTS_IN_MS),

	'click .user-info'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		instance.tabBarData.set(this);
		instance.tabBar.setTemplate('livechatAgentInfo');
		// instance.tabBar.setData({ label: t('Agent_Info'), icon: 'info-circled' });
		instance.tabBar.open();
	},
	/*
	'click .info-tabs button'(e) {
		e.preventDefault();
		$('.info-tabs button').removeClass('active');
		$(e.currentTarget).addClass('active');
		$('.user-info-content').hide();
		$($(e.currentTarget).attr('href')).show();
	},
	*/
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
	this.agents = new ReactiveVar([]);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([...this.selectedAgents.curValue, agent]);
	};

	this.onClickTagAgents = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.curValue.filter((user) => user.username !== username));
	};

	this.autorun(function() {
		const limit = instance.limit.get();
		loadAgents(instance, limit);
	});
	this.getAgentsWithCriteria = function() {
		let filter;

		if (instance.filter && instance.filter.get()) {
			filter = s.trim(instance.filter.get());
		}
		const regex = new RegExp(s.escapeRegExp(filter), 'i');
		return instance.agents.get()
			.filter((agent) => agent.name.match(regex)
				|| agent.username.match(regex)
				|| agent.emails.some((email) => email.address.match(regex)));
	};
});
