import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { modal } from '../../../../../app/ui-utils';
import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatUnits.html';

const ITEMS_COUNT = 50;
const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

Template.livechatUnits.helpers({
	units() {
		return Template.instance().units.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const units = instance.units.get();
			if (instance.total.get() > units.length) {
				instance.offset.set(instance.offset.get() + ITEMS_COUNT);
			}
		};
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatUnits.events({
	'click .remove-unit'(e, instance) {
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
			Meteor.call('livechat:removeUnit', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				instance.offset.set(0);
				instance.loadUnits(instance.offset.get());
				modal.open({
					title: t('Removed'),
					text: t('Unit_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .unit-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-unit-edit', { _id: this._id });
	},
});

Template.livechatUnits.onCreated(function() {
	this.units = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.loadUnits = async (offset) => {
		const { units, total } = await APIClient.v1.get(`livechat/units.list?count=${ ITEMS_COUNT }&offset=${ offset }`);
		this.total.set(total);
		if (offset === 0) {
			this.units.set(units);
		} else {
			this.units.set(this.units.get().concat(units));
		}
	};

	this.autorun(async () => {
		const offset = this.offset.get();
		this.loadUnits(offset);
	});
});
