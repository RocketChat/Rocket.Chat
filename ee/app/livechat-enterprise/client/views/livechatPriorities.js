import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { modal } from '../../../../../app/ui-utils';
import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatPriorities.html';

const ITEMS_COUNT = 50;
const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

Template.livechatPriorities.helpers({
	priorities() {
		return Template.instance().priorities.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const priorities = instance.priorities.get();
			if (instance.total.get() > priorities.length) {
				instance.offset.set(instance.offset.get() + ITEMS_COUNT);
			}
		};
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatPriorities.events({
	'click .remove-priority'(e, instance) {
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
			Meteor.call('livechat:removePriority', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				instance.offset.set(0);
				instance.loadPriorities(instance.offset.get());
				modal.open({
					title: t('Removed'),
					text: t('Priority_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .priority-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-priority-edit', { _id: this._id });
	},

});

Template.livechatPriorities.onCreated(function() {
	this.priorities = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.loadPriorities = async (offset) => {
		const { priorities, total } = await APIClient.v1.get(`livechat/priorities.list?count=${ ITEMS_COUNT }&offset=${ offset }`);
		this.total.set(total);
		if (offset === 0) {
			this.priorities.set(priorities);
		} else {
			this.priorities.set(this.priorities.get().concat(priorities));
		}
	};

	this.autorun(async () => {
		const offset = this.offset.get();
		this.loadPriorities(offset);
	});
});
