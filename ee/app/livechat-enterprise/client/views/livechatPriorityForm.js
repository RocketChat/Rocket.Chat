import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatPriorityForm.html';

const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

Template.livechatPriorityForm.helpers({
	priority() {
		return Template.instance().priority.get();
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatPriorityForm.events({
	'submit #priority-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const _id = $(e.currentTarget).data('id');
		const name = instance.$('input[name=name]').val();

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		const description = instance.$('textarea[name=description]').val();
		const dueTimeInMinutes = instance.$('input[name=dueTimeInMinutes]').val();

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const priorityData = {
			name: name.trim(),
			description: description.trim(),
			dueTimeInMinutes,
		};

		Meteor.call('livechat:savePriority', _id, priorityData, function(error/* , result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-priorities');
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-priorities');
	},
});

Template.livechatPriorityForm.onCreated(function() {
	this.priority = new ReactiveVar(null);

	this.autorun(async () => {
		const id = FlowRouter.getParam('_id');
		if (id) {
			const priority = await APIClient.v1.get(`livechat/priorities.getOne?priorityId=${ id }`);
			this.priority.set(priority);
		}
	});
});
