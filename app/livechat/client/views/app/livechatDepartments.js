import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import s from 'underscore.string';
import _ from 'underscore';

import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import { LivechatDepartment } from '../../collections/LivechatDepartment';
import './livechatDepartments.html';

Template.livechatDepartments.helpers({
	departments() {
		return Template.instance().departments();
	},
	isLoading() {
		return Template.instance().state.get('loading');
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

const DEBOUNCE_TIME_FOR_SEARCH_DEPARTMENTS_IN_MS = 300;

Template.livechatDepartments.events({
	'click .remove-department'(e/* , instance*/) {
		e.preventDefault();
		e.stopPropagation();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeDepartment', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Removed'),
					text: t('Department_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .department-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-department-edit', { _id: this._id });
	},

	'keydown #departments-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #departments-filter': _.debounce((e, t) => {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	}, DEBOUNCE_TIME_FOR_SEARCH_DEPARTMENTS_IN_MS),
});

Template.livechatDepartments.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.state = new ReactiveDict({
		loading: false,
	});
	this.ready = new ReactiveVar(true);

	this.autorun(function() {
		const limit = instance.limit.get();
		const subscription = instance.subscribe('livechat:departments', null, limit);
		instance.ready.set(subscription.ready());
	});
	this.departments = function() {
		let filter;
		let query = {};

		if (instance.filter && instance.filter.get()) {
			filter = s.trim(instance.filter.get());
		}

		if (filter) {
			query = { name: new RegExp(s.escapeRegExp(filter), 'i') };
		}

		const limit = instance.limit && instance.limit.get();
		return LivechatDepartment.find(query, { limit, sort: { name: 1 } }).fetch();
	};
});
