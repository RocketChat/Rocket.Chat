import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import './livechatTriggers.html';
import { APIClient } from '../../../../utils/client';

const loadTriggers = async (instance) => {
	const { triggers } = await APIClient.v1.get('livechat/triggers');
	instance.triggers.set(triggers);
};

Template.livechatTriggers.helpers({
	triggers() {
		return Template.instance().triggers.get();
	},
});

Template.livechatTriggers.events({
	'click .remove-trigger'(e, instance) {
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
			Meteor.call('livechat:removeTrigger', this._id, async function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				await loadTriggers(instance);
				modal.open({
					title: t('Removed'),
					text: t('Trigger_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .trigger-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-trigger-edit', { _id: this._id });
	},
});

Template.livechatTriggers.onCreated(async function() {
	this.triggers = new ReactiveVar([]);
	await loadTriggers(this);
});
