import toastr from 'toastr';
Template.livechatTriggersForm.helpers({
	name() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.name;
	},
	description() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.description;
	},
	enabled() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.enabled;
	},
	conditions() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		if (!trigger) {
			return [];
		}

		return trigger.conditions;
	},
	actions() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		if (!trigger) {
			return [];
		}

		return trigger.actions;
	}
});

Template.livechatTriggersForm.events({
	'submit #trigger-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const data = {
			_id: FlowRouter.getParam('_id'),
			name: instance.$('input[name=name]').val(),
			description: instance.$('input[name=description]').val(),
			enabled: instance.$('input[name=enabled]:checked').val() === '1' ? true : false,
			conditions: [],
			actions: []
		};

		$('.each-condition').each(function() {
			data.conditions.push({
				name: $('.trigger-condition', this).val(),
				value: $(`.${ $('.trigger-condition', this).val() }-value`).val()
			});
		});

		$('.each-action').each(function() {
			if ($('.trigger-action', this).val() === 'send-message') {
				data.actions.push({
					name: $('.trigger-action', this).val(),
					params: {
						name: $('[name=send-message-name]', this).val(),
						msg: $('[name=send-message-msg]', this).val()
					}
				});
			} else {
				data.actions.push({
					name: $('.trigger-action', this).val(),
					value: $(`.${ $('.trigger-action', this).val() }-value`).val()
				});
			}
		});

		Meteor.call('livechat:saveTrigger', data, function(error/*, result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			FlowRouter.go('livechat-triggers');

			toastr.success(t('Saved'));
		});
	},

	'click button.back'(e/*, instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-triggers');
	}
});

Template.livechatTriggersForm.onCreated(function() {
	this.subscribe('livechat:triggers', FlowRouter.getParam('_id'));
});
