import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { settings } from '../../../../settings';
import { hasPermission } from '../../../../authorization';
import { Users } from '../../../../models';
import './livechatQueue.html';
import { APIClient } from '../../../../utils/client';

const QUEUE_COUNT = 50;

Template.livechatQueue.helpers({
	departments() {
		return Template.instance().departments.get().filter((department) => department.enabled === true);
	},
	onSelectAgents() {
		return Template.instance().onSelectAgents;
	},
	agentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	selectedAgents() {
		return Template.instance().selectedAgents.get();
	},
	onClickTagAgent() {
		return Template.instance().onClickTagAgent;
	},
	queue() {
		return Template.instance().queue.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	hasPermission() {
		const user = Users.findOne(Meteor.userId(), { fields: { statusLivechat: 1 } });
		return hasPermission(Meteor.userId(), 'view-livechat-queue') || (user.statusLivechat === 'available' && settings.get('Livechat_show_queue_list_link'));
	},
	hasMore() {
		const instance = Template.instance();
		const queue = instance.queue.get();
		return instance.total.get() > queue.length;
	},
});

Template.livechatQueue.events({
	'click .show-offline'(event, instance) {
		const showOffline = instance.showOffline.get();

		showOffline[this._id] = event.currentTarget.checked;

		instance.showOffline.set(showOffline);
	},
	'submit form'(event, instance) {
		event.preventDefault();
		instance.queue.set([]);
		instance.offset.set(0);

		const filter = {};
		$(':input', event.currentTarget).each(function() {
			if (!this.name) {
				return;
			}

			const value = $(this).val();

			filter[this.name] = value;
		});
		const agents = instance.selectedAgents.get();
		if (agents && agents.length > 0) {
			filter.agent = agents[0]._id;
		}
		instance.filter.set(filter);
	},
	'click .js-load-more'(event, instance) {
		instance.offset.set(instance.offset.get() + QUEUE_COUNT);
	},
});

Template.livechatQueue.onCreated(async function() {
	this.selectedAgents = new ReactiveVar([]);
	this.departments = new ReactiveVar([]);
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});
	this.queue = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(true);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(async () => {
		this.isLoading.set(true);
		const filter = this.filter.get();
		const offset = this.offset.get();
		let query = `includeOfflineAgents=${ filter.agentStatus === 'offline' }`;
		if (filter.agent) {
			query += `&agentId=${ filter.agent }`;
		}
		if (filter.department) {
			query += `&departmentId=${ filter.department }`;
		}
		const { queue, total } = await APIClient.v1.get(`livechat/queue?${ query }&count=${ QUEUE_COUNT }&offset=${ offset }`);
		this.total.set(total);
		this.queue.set(this.queue.get().concat(queue));
		this.isLoading.set(false);
	});

	const { departments } = await APIClient.v1.get('livechat/department?sort={"name": 1}');
	this.departments.set(departments);
});
