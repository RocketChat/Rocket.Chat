import 'moment-timezone';
import _ from 'underscore';
import moment from 'moment';
import './livechatCurrentChats.css';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import toastr from 'toastr';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { modal, call, popover } from '../../../../ui-utils';
import { t, handleError, APIClient } from '../../../../utils/client';
import { hasRole, hasPermission } from '../../../../authorization';
import './livechatCurrentChats.html';

const ROOMS_COUNT = 50;
const FILTER_STORE_NAME = 'Filters.LivechatCurrentChats';

const loadStoredFilters = () => {
	let storedFilters;
	try {
		const storeItem = Meteor._localStorage.getItem(FILTER_STORE_NAME);
		storedFilters = storeItem ? JSON.parse(Meteor._localStorage.getItem(FILTER_STORE_NAME)) : {};
	} catch (e) {
		storedFilters = {};
	}

	return storedFilters;
};

const storeFilters = (filters) => {
	Meteor._localStorage.setItem(FILTER_STORE_NAME, JSON.stringify(filters));
};

const removeStoredFilters = () => {
	Meteor._localStorage.removeItem(FILTER_STORE_NAME);
};

Template.livechatCurrentChats.helpers({
	hasMore() {
		const instance = Template.instance();
		return instance.total.get() > instance.livechatRooms.get().length;
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	livechatRoom() {
		return Template.instance().livechatRooms.get();
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
	tagId() {
		return this;
	},
	departmentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	onClickTagDepartment() {
		return Template.instance().onClickTagDepartment;
	},
	selectedDepartments() {
		return Template.instance().selectedDepartments.get();
	},
	onSelectDepartments() {
		return Template.instance().onSelectDepartments;
	},
	onTableSort() {
		const { sortDirection, sortBy } = Template.instance();
		return function(type) {
			if (sortBy.get() === type) {
				return sortDirection.set(sortDirection.get() === 'asc' ? 'desc' : 'asc');
			}
			sortBy.set(type);
			sortDirection.set('asc');
		};
	},
	sortBy(key) {
		return Template.instance().sortBy.get() === key;
	},
	sortIcon(key) {
		const { sortDirection, sortBy } = Template.instance();
		return key === sortBy.get() && sortDirection.get() === 'asc'
			? 'sort-up'
			: 'sort-down';
	},
});

Template.livechatCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('live', { id: this._id });
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
	'click .livechat-current-chats-extra-actions'(event, instance) {
		event.preventDefault();
		event.stopPropagation();
		const { currentTarget } = event;

		const canRemoveAllClosedRooms = hasPermission('remove-closed-livechat-rooms');
		const allowedDepartments = () => {
			if (hasRole(Meteor.userId(), ['admin', 'livechat-manager'])) {
				return;
			}

			const departments = instance.departments.get();
			return departments && departments.map((d) => d._id);
		};

		const config = {
			popoverClass: 'livechat-current-chats-add-filter',
			columns: [{
				groups: [
					{
						items: [
							{
								icon: 'customize',
								name: t('Clear_filters'),
								action: instance.clearFilters,
							},
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
			filter.agents = [agents[0]];
		}

		const departments = instance.selectedDepartments.get();
		if (departments && departments.length > 0) {
			filter.department = [departments[0]];
		}

		instance.filter.set(filter);
		instance.offset.set(0);
		storeFilters(filter);
	},
	'click .remove-livechat-room'(event, instance) {
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

Template.livechatCurrentChats.onCreated(async function() {
	this.isLoading = new ReactiveVar(false);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.filter = new ReactiveVar(loadStoredFilters());
	this.livechatRooms = new ReactiveVar([]);
	this.selectedAgents = new ReactiveVar([]);
	this.customFilters = new ReactiveVar([]);
	this.customFields = new ReactiveVar([]);
	this.tagFilters = new ReactiveVar([]);
	this.selectedDepartments = new ReactiveVar([]);
	this.sortBy = new ReactiveVar('ts');
	this.sortDirection = new ReactiveVar('desc');

	this.onSelectDepartments = ({ item: department }) => {
		department.text = department.name;
		this.selectedDepartments.set([department]);
	};

	this.onClickTagDepartment = () => {
		this.selectedDepartments.set([]);
	};

	const mountArrayQueryParameters = (label, items, index) => items.reduce((acc, item) => {
		const isTheLastElement = index === items.length - 1;
		acc += `${ label }[]=${ item }${ isTheLastElement ? '' : '&' }`;
		return acc;
	}, '');

	const mountUrlWithParams = (filter, offset, sort) => {
		const { status, agents, department, from, to, tags, customFields, name: roomName } = filter;
		let url = `livechat/rooms?count=${ ROOMS_COUNT }&offset=${ offset }&sort=${ JSON.stringify(sort) }`;
		const dateRange = {};
		if (status) {
			url += `&open=${ status === 'opened' }`;
		}
		if (department && Array.isArray(department) && department.length) {
			url += `&departmentId=${ department[0]._id }`;
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
			url += `&${ mountArrayQueryParameters('agents', agents.map((agent) => agent._id)) }`;
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

	this.loadDefaultFilters = () => {
		const defaultFilters = this.filter.get();

		Object.keys(defaultFilters).forEach((key) => {
			const value = defaultFilters[key];
			if (!value) {
				return;
			}

			switch (key) {
				case 'agents':
					return this.selectedAgents.set(value);
				case 'department':
					return this.selectedDepartments.set(value);
				case 'from':
				case 'to':
					return $(`#${ key }`).datepicker('setDate', new Date(value));
			}

			$(`#${ key }`).val(value);
		});
	};

	this.clearFilters = () => {
		removeStoredFilters();
		$('#form-filters').get(0).reset();
		this.selectedAgents.set([]);
		this.selectedDepartments.set([]);
		this.filter.set({});
	};

	this.loadRooms = async (filter, offset, sort) => {
		this.isLoading.set(true);
		const { rooms, total } = await APIClient.v1.get(mountUrlWithParams(filter, offset, sort));
		this.total.set(total);
		if (offset === 0) {
			this.livechatRooms.set(rooms);
		} else {
			this.livechatRooms.set(this.livechatRooms.get().concat(rooms));
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
		const { sortDirection, sortBy } = Template.instance();
		this.loadRooms(filter, offset, { [sortBy.get()]: sortDirection.get() === 'asc' ? 1 : -1 });
	});

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

	this.loadDefaultFilters();
});

Template.livechatCurrentChats.onRendered(function() {
	this.$('.input-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});
