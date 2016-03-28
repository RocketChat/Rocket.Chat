Template.livechatTriggers.helpers({
	conditions() {
		var trigger = Template.instance().trigger.get();
		if (!trigger) {
			return [];
		}

		return trigger.conditions;
	},
	actions() {
		var trigger = Template.instance().trigger.get();
		if (!trigger) {
			return [];
		}

		return trigger.actions;
	}
});

Template.livechatTriggers.events({
	'submit #trigger-form' (e, instance) {
		e.preventDefault();
		var $btn = instance.$('button.save');

		var oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		var data = {
			conditions: [],
			actions: []
		};

		$('.each-condition').each(function() {
			data.conditions.push({
				name: $('.trigger-condition', this).val(),
				value: $('.' + $('.trigger-condition', this).val() + '-value').val()
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
					value: $('.' + $('.trigger-action', this).val() + '-value').val()
				});
			}
		});

		Meteor.call('livechat:saveTrigger', data, function(error/*, result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Saved'));
		});
	},

	'click .delete-trigger' (e/*, instance*/) {
		e.preventDefault();

		swal({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeTrigger', function(error/*, result*/) {
				if (error) {
					return toastr.error(t(error.reason || error.error));
				}

				swal({
					title: t('Removed'),
					text: t('Trigger_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	}
});

Template.livechatTriggers.onCreated(function() {
	this.subscribe('livechat:trigger');
	this.trigger = new ReactiveVar(null);
	this.autorun(() => {
		this.trigger.set(LivechatTrigger.findOne());
	});
});
