Template.livechatTriggers.helpers({
	urlRegex() {
		return Template.instance().trigger.get().urlRegex;
	},
	time() {
		return Template.instance().trigger.get().time;
	},
	message() {
		return Template.instance().trigger.get().message;
	},
});

Template.livechatTriggers.events({
	'submit #trigger-form' (e, instance) {
		e.preventDefault();
		var $btn = instance.$('button.save');

		var oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		var data = {
			urlRegex: instance.$('input[name=url-regex]').val(),
			time: instance.$('input[name=trigger-time]').val(),
			message: instance.$('input[name=trigger-message]').val()
		};

		Meteor.call('livechat:saveTrigger', data, function(error, result) {
			$btn.html(oldBtnValue);
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Saved'));
		});
	},
});

Template.livechatTriggers.onCreated(function() {
	this.subscribe('livechat:trigger');
	this.trigger = new ReactiveVar({
		urlRegex: '',
		time: '',
		message: '',
	});
	this.autorun(() => {
		trigger = LivechatTrigger.findOne();
		if (trigger) {
			this.trigger.set(trigger);
		}
	});
});
