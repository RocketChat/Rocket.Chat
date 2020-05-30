import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import _ from 'underscore';

import { modal, call } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import { APIClient } from '../../../../utils/client';

import './livechatManagers.html';

const MANAGERS_COUNT = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

const getUsername = (user) => user.username;
Template.livechatManagers.helpers({
	exceptionsManagers() {
		const { selectedManagers } = Template.instance();
		return Template.instance()
			.managers
			.get()
			.map(getUsername)
			.concat(selectedManagers.get().map(getUsername));
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
		return Template.instance().managers.get();
	},
	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	},
	managerModifier() {
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
	onSelectManagers() {
		return Template.instance().onSelectManagers;
	},
	selectedManagers() {
		return Template.instance().selectedManagers.get();
	},
	onClickTagManagers() {
		return Template.instance().onClickTagManagers;
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const managers = instance.managers.get();
			if (instance.total.get() > managers.length) {
				instance.offset.set(instance.offset.get() + MANAGERS_COUNT);
			}
		};
	},
});

Template.livechatManagers.events({
	'click .remove-manager'(e, instance) {
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
					error, /* , result*/
				) {
					if (error) {
						return handleError(error);
					}
					instance.loadManagers(instance.filter.get(), 0);
					modal.open({
						title: t('Removed'),
						text: t('Manager_removed'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				});
			},
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
				users.map(({ username }) => call('livechat:addManager', username)),
			);
			selectedManagers.set([]);
		} finally {
			state.set('loading', false);
			instance.loadManagers(instance.filter.get(), 0);
		}
	},
	'keydown #managers-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #managers-filter': _.debounce((e, t) => {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
		t.offset.set(0);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS),
});

Template.livechatManagers.onCreated(function() {
	const instance = this;
	this.offset = new ReactiveVar(0);
	this.filter = new ReactiveVar('');
	this.state = new ReactiveDict({
		loading: false,
	});
	this.total = new ReactiveVar(0);
	this.managers = new ReactiveVar([]);
	this.selectedManagers = new ReactiveVar([]);

	this.onSelectManagers = ({ item: manager }) => {
		this.selectedManagers.set([...this.selectedManagers.curValue, manager]);
	};

	this.onClickTagManagers = ({ username }) => {
		this.selectedManagers.set(
			this.selectedManagers.curValue.filter((user) => user.username !== username),
		);
	};

	this.loadManagers = _.debounce(async (filter, offset) => {
		this.state.set('loading', true);
		let url = `livechat/users/manager?count=${ MANAGERS_COUNT }&offset=${ offset }`;
		if (filter) {
			url += `&text=${ encodeURIComponent(filter) }`;
		}
		const { users, total } = await APIClient.v1.get(url);
		this.total.set(total);
		if (offset === 0) {
			this.managers.set(users);
		} else {
			this.managers.set(this.managers.get().concat(users));
		}
		this.state.set('loading', false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(async () => {
		const filter = instance.filter.get();
		const offset = instance.offset.get();
		return this.loadManagers(filter, offset);
	});
});
