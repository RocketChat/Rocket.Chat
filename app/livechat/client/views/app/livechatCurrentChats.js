import _ from 'underscore';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { modal, call, popover } from '../../../../ui-utils';
import { t, APIClient } from '../../../../utils/client';
import { LivechatRoom } from '../../collections/LivechatRoom';
import './livechatCurrentChats.html';

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
	customFilters() {
		return Template.instance().customFilters.get();
	},
	tagFilters() {
		return Template.instance().tagFilters.get();
	},
	departments() {
		return Template.instance().departments.get();
	},
	tagId() {
		return this;
	},
});

Template.livechatCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('live', { id: this._id });
	},
	'click .js-load-more'(event, instance) {
		instance.limit.set(instance.limit.get() + 20);
	},
	'click .add-filter-button'(event, instance) {
		event.preventDefault();

		const customFields = instance.customFields.get();
		const filters = instance.customFilters.get();
		const tagFilters = instance.tagFilters.get();
		const options = [];

		options.push({
			name: t('Tags'),
			action: () => {
				tagFilters.push(Random.id());
				instance.tagFilters.set(tagFilters);
			},
		});

		for (const field of customFields) {
			if (field.visibility !== 'visible') {
				continue;
			}
			if (field.scope !== 'room') {
				continue;
			}

			if (filters.find((filter) => filter.name === field._id)) {
				continue;
			}

			options.push({
				name: field.label,
				action: () => {
					filters.push({
						_id: field._id,
						name: field._id,
						label: field.label,
					});
					instance.customFilters.set(filters);
				},
			});
		}

		const config = {
			popoverClass: 'livechat-current-chats-add-filter',
			columns: [
				{
					groups: [
						{
							items: options,
						},
					],
				},
			],
			currentTarget: event.currentTarget,
			offsetVertical: event.currentTarget.clientHeight,
		};

		popover.open(config);
	},
	'click .remove-livechat-tags-filter'(event, instance) {
		event.preventDefault();

		const { id } = event.currentTarget.dataset;
		const tagFilters = instance.tagFilters.get();
		const index = tagFilters.indexOf(id);

		if (index >= 0) {
			tagFilters.splice(index, 1);
		}
		instance.tagFilters.set(tagFilters);
	},
	'click .remove-livechat-custom-filter'(event, instance) {
		event.preventDefault();
		const fieldName = event.currentTarget.dataset.name;

		const filters = instance.customFilters.get();
		const index = filters.findIndex((filter) => filter.name === fieldName);

		if (index >= 0) {
			filters.splice(index, 1);
		}

		instance.customFilters.set(filters);
	},
	'submit form'(event, instance) {
		event.preventDefault();
		const filter = {};
		$(':input', event.currentTarget).each(function() {
			if (!this.name) {
				return;
			}

			const value = $(this).val();

			if (this.name.startsWith('custom-field-')) {
				if (!filter.customFields) {
					filter.customFields = {};
				}

				filter.customFields[this.name.replace('custom-field-', '')] = value;
				return;
			}

			if (this.name === 'tags') {
				if (!filter.tags) {
					filter.tags = [];
				}

				if (value) {
					filter.tags.push(value);
				}

				return;
			}

			filter[this.name] = value;
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

Template.livechatCurrentChats.onCreated(async function() {
	this.ready = new ReactiveVar(false);
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});
	this.selectedAgents = new ReactiveVar([]);
	this.customFilters = new ReactiveVar([]);
	this.customFields = new ReactiveVar([]);
	this.tagFilters = new ReactiveVar([]);
	this.departments = new ReactiveVar([]);

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(async () => {
		this.ready.set(this.subscribe('livechat:rooms', this.filter.get(), 0, this.limit.get()).ready());
	});

	const { departments } = await APIClient.v1.get('livechat/department?sort={"name": 1}');
	this.departments.set(departments);

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

});

Template.livechatCurrentChats.onRendered(function() {
	this.$('.input-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});
