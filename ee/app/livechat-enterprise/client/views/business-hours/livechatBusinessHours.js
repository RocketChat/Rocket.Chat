import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveDict } from 'meteor/reactive-dict';

import { hasLicense } from '../../../../license/client';
import './livechatBusinessHours.html';
import { modal } from '../../../../../../app/ui-utils/client';
import { APIClient, handleError, t } from '../../../../../../app/utils';

const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

Template.livechatBusinessHours.helpers({
	hasLicense() {
		return licenseEnabled.get();
	},
	businessHours() {
		return Template.instance().businessHours.get();
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

const DEBOUNCE_TIME_FOR_SEARCH_IN_MS = 300;

Template.livechatBusinessHours.events({
	'click .remove-business-hour'(e, instance) {
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
			Meteor.call('livechat:removeDepartment', this._id, (error/* , result*/) => {
				if (error) {
					return handleError(error);
				}
				instance.departments.set(instance.departments.curValue.filter((department) => department._id !== this._id));
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

	'click .business-hour-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-business-hour-edit', { _id: this._id });
	},

	'keydown #business-hour-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #business-hour-filter': _.debounce((e, t) => {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	}, DEBOUNCE_TIME_FOR_SEARCH_IN_MS),
});


Template.livechatBusinessHours.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.state = new ReactiveDict({
		loading: false,
	});
	this.ready = new ReactiveVar(true);
	this.businessHours = new ReactiveVar([]);

	this.autorun(async function() {
		const limit = instance.limit.get();
		const filter = instance.filter.get();
		let baseUrl = `livechat/business-hours.list?count=${ limit }`;

		if (filter) {
			baseUrl += `&name=${ encodeURIComponent(filter) }`;
		}

		const { businessHours } = await APIClient.v1.get(baseUrl);
		instance.businessHours.set(businessHours);
		instance.ready.set(true);
	});
});
