import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import _ from 'underscore';

import { modal, call } from '../../../../../app/ui-utils';
import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatMonitors.html';

const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

const ITEMS_COUNT = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 300;

const getUsername = (user) => user.username;
Template.livechatMonitors.helpers({
	exceptionsMonitors() {
		const { selectedMonitors, monitors } = Template.instance();
		return monitors
			.get()
			.map(getUsername)
			.concat(selectedMonitors.get().map(getUsername));
	},
	deleteLastMonitor() {
		const i = Template.instance();
		return () => {
			const arr = i.selectedMonitors.curValue;
			arr.pop();
			i.selectedMonitors.set(arr);
		};
	},
	isLoading() {
		return Template.instance().state.get('loading');
	},
	monitors() {
		return Template.instance().monitors.get();
	},
	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	},
	monitorModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${
				f.length === 0
					? text
					: text.replace(
						new RegExp(filter.get()),
						(part) => `<strong>${ part }</strong>`,
					)
			}`;
		};
	},
	onSelectMonitors() {
		return Template.instance().onSelectMonitors;
	},
	selectedMonitors() {
		return Template.instance().selectedMonitors.get();
	},
	onClickTagMonitors() {
		return Template.instance().onClickTagMonitors;
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const monitors = instance.monitors.get();
			if (instance.total.get() > monitors.length) {
				instance.offset.set(instance.offset.get() + ITEMS_COUNT);
			}
		};
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatMonitors.events({
	'click .remove-monitor'(e, instance) {
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
				Meteor.call('livechat:removeMonitor', this.username, function(
					error, /* , result*/
				) {
					if (error) {
						return handleError(error);
					}
					instance.offset.set(0);
					instance.loadMonitors(instance.filter.get(), instance.offset.get());
					modal.open({
						title: t('Removed'),
						text: t('Monitor_removed'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				});
			},
		);
	},

	async 'submit #form-monitor'(e, instance) {
		e.preventDefault();
		const { selectedMonitors, state } = instance;

		const users = selectedMonitors.get();

		if (!users.length) {
			return;
		}

		state.set('loading', true);
		try {
			await Promise.all(
				users.map(({ username }) => call('livechat:addMonitor', username)),
			);
			selectedMonitors.set([]);
		} finally {
			state.set('loading', false);
			instance.offset.set(0);
			instance.loadMonitors(instance.filter.get(), instance.offset.get());
		}
	},
	'keydown #monitor-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #monitor-filter': _.debounce((e, t) => {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
		t.offset.set(0);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS),
});

Template.livechatMonitors.onCreated(function() {
	const instance = this;
	this.offset = new ReactiveVar(0);
	this.filter = new ReactiveVar('');
	this.state = new ReactiveDict({
		loading: false,
	});
	this.total = new ReactiveVar(0);
	this.monitors = new ReactiveVar([]);
	this.selectedMonitors = new ReactiveVar([]);

	this.onSelectMonitors = ({ item: monitor }) => {
		this.selectedMonitors.set([...this.selectedMonitors.curValue, monitor]);
	};

	this.onClickTagMonitors = ({ username }) => {
		this.selectedMonitors.set(this.selectedMonitors.curValue.filter((user) => user.username !== username));
	};

	this.loadMonitors = _.debounce(async (filter, offset) => {
		this.state.set('loading', true);
		let url = `livechat/monitors.list?count=${ ITEMS_COUNT }&offset=${ offset }`;
		if (filter) {
			url += `&text=${ encodeURIComponent(filter) }`;
		}
		const { monitors, total } = await APIClient.v1.get(url);
		this.total.set(total);
		if (offset === 0) {
			this.monitors.set(monitors);
		} else {
			this.monitors.set(this.monitors.get().concat(monitors));
		}
		this.state.set('loading', false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(async () => {
		const filter = instance.filter.get();
		const offset = instance.offset.get();
		return this.loadMonitors(filter, offset);
	});
});
