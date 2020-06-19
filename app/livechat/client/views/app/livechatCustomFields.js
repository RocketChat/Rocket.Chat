import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { modal } from '../../../../ui-utils';
import { t, handleError, APIClient } from '../../../../utils/client';
import './livechatCustomFields.html';

const CUSTOM_FIELDS_COUNT = 50;

Template.livechatCustomFields.helpers({
	customFields() {
		return Template.instance().customFields.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const customFields = instance.customFields.get();
			if (instance.total.get() <= customFields.length) {
				return;
			}
			return instance.offset.set(instance.offset.get() + CUSTOM_FIELDS_COUNT);
		};
	},
});

Template.livechatCustomFields.events({
	'click .remove-custom-field'(e, instance) {
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
			Meteor.call('livechat:removeCustomField', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				instance.offset.set(0);
				modal.open({
					title: t('Removed'),
					text: t('Field_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .custom-field-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-customfield-edit', { _id: this._id });
	},
});

Template.livechatCustomFields.onCreated(function() {
	this.customFields = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.autorun(async () => {
		const offset = this.offset.get();
		const { customFields, total } = await APIClient.v1.get(`livechat/custom-fields?count=${ CUSTOM_FIELDS_COUNT }&offset=${ offset }`);
		if (offset === 0) {
			this.customFields.set(customFields);
		} else {
			this.customFields.set(this.customFields.get().concat(customFields));
		}
		this.total.set(total);
	});
});
