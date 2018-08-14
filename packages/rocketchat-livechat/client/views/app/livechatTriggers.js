Template.livechatTriggers.helpers({
	triggers() {
		return LivechatTrigger.find();
	}
});

Template.livechatTriggers.events({
	'click .remove-trigger'(e/*, instance*/) {
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
			html: false
		}, () => {
			Meteor.call('livechat:removeTrigger', this._id, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Removed'),
					text: t('Trigger_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	},

	'click .trigger-info'(e/*, instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-trigger-edit', { _id: this._id });
	},

	'click .delete-trigger'(e/*, instance*/) {
		e.preventDefault();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:removeTrigger', this._id, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}

				modal.open({
					title: t('Removed'),
					text: t('Trigger_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	}
});

Template.livechatTriggers.onCreated(function() {
	this.subscribe('livechat:triggers');
});
