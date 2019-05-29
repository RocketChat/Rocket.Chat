import _ from 'underscore';
import moment from 'moment';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { modal, call } from '../../../../ui-utils';
import { t } from '../../../../utils/client';
import './livechatCurrentChats.html';

const LivechatRoom = new Mongo.Collection('livechatRoom');

Template.livechatCurrentChats.helpers({
	hasMore() {
		return Template.instance().ready.get() && LivechatRoom.find({ t: 'l' }, { sort: { ts: -1 } }).count() === Template.instance().limit.get();
	},
	isReady() {
		return Template.instance().ready.get();
	},
	livechatRoom() {
		return LivechatRoom.find({ t: 'l' }, { sort: { ts: -1 } });
	},
	startedAt() {
		return moment(this.ts).format('L LTS');
	},
	lastMessage() {
		return moment(this.lm).format('L LTS');
	},
	servedBy() {
		return this.servedBy && this.servedBy.username;
	},
	status() {
		return this.open ? t('Opened') : t('Closed');
	},
	isClosed() {
		return !this.open;
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
});

Template.livechatCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('live', { id: this._id });
	},
	'click .js-load-more'(event, instance) {
		instance.limit.set(instance.limit.get() + 20);
	},
	'submit form'(event, instance) {
		event.preventDefault();

		const filter = {};
		$(':input', event.currentTarget).each(function() {
			if (this.name) {
				filter[this.name] = $(this).val();
			}
		});

		if (!_.isEmpty(filter.from)) {
			filter.from = moment(filter.from, moment.localeData().longDateFormat('L')).toDate();
		} else {
			delete filter.from;
		}

		if (!_.isEmpty(filter.to)) {
			filter.to = moment(filter.to, moment.localeData().longDateFormat('L')).toDate();
		} else {
			delete filter.to;
		}

		const agents = instance.selectedAgents.get();
		if (agents && agents.length > 0) {
			filter.agent = agents[0]._id;
		}

		instance.filter.set(filter);
		instance.limit.set(20);
	},
	'click .remove-livechat-room'(event) {
		event.preventDefault();
		event.stopPropagation();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, async (confirmed) => {
			if (!confirmed) {
				return;
			}
			await call('livechat:removeRoom', this._id);
			modal.open({
				title: t('Deleted'),
				text: t('Room_has_been_deleted'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false,
			});
		});
	},

	'input [id=agent]'(event, template) {
		const input = event.currentTarget;
		if (input.value === '') {
			template.selectedAgents.set([]);
		}
	},
});

Template.livechatCurrentChats.onCreated(function() {
	this.ready = new ReactiveVar(false);
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});
	this.selectedAgents = new ReactiveVar([]);

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(() => {
		this.ready.set(this.subscribe('livechat:rooms', this.filter.get(), 0, this.limit.get()).ready());
	});
});

Template.livechatCurrentChats.onRendered(function() {
	this.$('.input-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});
