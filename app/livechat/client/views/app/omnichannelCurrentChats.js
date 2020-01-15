import 'moment-timezone';
import _ from 'underscore';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import toastr from 'toastr';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { modal, call, popover } from '../../../../ui-utils';
import { t, handleError, APIClient } from '../../../../utils/client';
import { hasRole, hasPermission, hasAtLeastOnePermission } from '../../../../authorization';
import './omnichannelCurrentChats.html';

const ROOMS_COUNT = 50;

Template.omnichannelCurrentChats.helpers({
	hasMore() {
		const instance = Template.instance();
		return instance.total.get() > instance.omnichannelRooms.get().length;
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	omnichannelRooms() {
		return Template.instance().omnichannelRooms.get();
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
	hasPopoverPermissions() {
		return hasAtLeastOnePermission(['remove-closed-omnichannel-rooms']);
	},
});

Template.omnichannelCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('omnichannel', { id: this._id });
	},
	'click .js-load-more'(event, instance) {
		instance.offset.set(instance.offset.get() + ROOMS_COUNT);
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
			popoverClass: 'omnichannel-current-chats-add-filter',
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
	'click .omnichannel-current-chats-extra-actions'(event, instance) {
		event.preventDefault();
		event.stopPropagation();
		const { currentTarget } = event;

		const canRemoveAllClosedRooms = hasPermission('remove-closed-omnichannel-rooms');
		const allowedDepartments = () => {
			if (hasRole(Meteor.userId(), ['admin', 'livechat-manager'])) {
				return;
			}

			const departments = instance.departments.get();
			return departments && departments.map((d) => d._id);
		};

		const config = {
			popoverClass: 'omnichannel-current-chats-add-filter',
			columns: [{
				groups: [
					{
						items: [
							canRemoveAllClosedRooms
							&& {
								icon: 'trash',
								name: t('Delete_all_closed_chats'),
								modifier: 'alert',
								action: () => {
									modal.open({
										title: t('Are_you_sure'),
										type: 'warning',
										showCancelButton: true,
										confirmButtonColor: '#DD6B55',
										confirmButtonText: t('Yes'),
										cancelButtonText: t('Cancel'),
										closeOnConfirm: true,
										html: false,
									}, () => {
										Meteor.call('livechat:removeAllClosedRooms', allowedDepartments(), (err, result) => {
											if (err) {
												return handleError(err);
											}

											if (result) {
												instance.loadRooms(instance.filter.get(), instance.offset.get());
												toastr.success(TAPi18n.__('All_closed_chats_have_been_removed'));
											}
										});
									});
								},
							},
						],
					},
				],
			}],
			currentTarget,
			offsetVertical: currentTarget.clientHeight,
		};

		popover.open(config);
	},
	'click .remove-omnichannel-tags-filter'(event, instance) {
		event.preventDefault();

		const { id } = event.currentTarget.dataset;
		const tagFilters = instance.tagFilters.get();
		const index = tagFilters.indexOf(id);

		if (index >= 0) {
			tagFilters.splice(index, 1);
		}
		instance.tagFilters.set(tagFilters);
	},
	'click .remove-omnichannel-custom-filter'(event, instance) {
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
			if (!value) {
				return;
			}

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
			filter.agents = [agents[0]._id];
		}

		instance.filter.set(filter);
		instance.offset.set(0);
	},
	'click .remove-omnichannel-room'(event, instance) {
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
			instance.loadRooms(instance.filter.get(), instance.offset.get());
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

Template.omnichannelCurrentChats.onCreated(async function() {
	this.isLoading = new ReactiveVar(false);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.filter = new ReactiveVar({});
	this.omnichannelRooms = new ReactiveVar([]);
	this.selectedAgents = new ReactiveVar([]);
	this.customFilters = new ReactiveVar([]);
	this.customFields = new ReactiveVar([]);
	this.tagFilters = new ReactiveVar([]);
	this.departments = new ReactiveVar([]);

	const mountArrayQueryParameters = (label, items, index) => items.reduce((acc, item) => {
		const isTheLastElement = index === items.length - 1;
		acc += `${ label }[]=${ item }${ isTheLastElement ? '' : '&' }`;
		return acc;
	}, '');

	const mountUrlWithParams = (filter, offset) => {
		const { status, agents, department, from, to, tags, customFields, name: roomName } = filter;
		let url = `livechat/rooms?count=${ ROOMS_COUNT }&offset=${ offset }&sort={"ts": -1}`;
		const dateRange = {};
		if (status) {
			url += `&open=${ status === 'opened' }`;
		}
		if (department) {
			url += `&departmentId=${ department }`;
		}
		if (from) {
			dateRange.start = `${ moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss') }Z`;
		}
		if (to) {
			dateRange.end = `${ moment(new Date(to).setHours(23, 59, 59)).utc().format('YYYY-MM-DDTHH:mm:ss') }Z`;
		}
		if (tags) {
			url += `&${ mountArrayQueryParameters('tags', tags) }`;
		}
		if (agents && Array.isArray(agents) && agents.length) {
			url += `&${ mountArrayQueryParameters('agents', agents) }`;
		}
		if (customFields) {
			url += `&customFields=${ JSON.stringify(customFields) }`;
		}
		if (Object.keys(dateRange).length) {
			url += `&createdAt=${ JSON.stringify(dateRange) }`;
		}
		if (roomName) {
			url += `&roomName=${ roomName }`;
		}
		return url;
	};

	this.loadRooms = async (filter, offset) => {
		this.isLoading.set(true);
		const { rooms, total } = await APIClient.v1.get(mountUrlWithParams(filter, offset));
		this.total.set(total);
		if (offset === 0) {
			this.omnichannelRooms.set(rooms);
		} else {
			this.omnichannelRooms.set(this.omnichannelRooms.get().concat(rooms));
		}
		this.isLoading.set(false);
	};

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(async () => {
		const filter = this.filter.get();
		const offset = this.offset.get();
		this.loadRooms(filter, offset);
	});

	const { departments } = await APIClient.v1.get('livechat/department?sort={"name": 1}');
	this.departments.set(departments);

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});
});

Template.omnichannelCurrentChats.onRendered(function() {
	this.$('.input-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});
