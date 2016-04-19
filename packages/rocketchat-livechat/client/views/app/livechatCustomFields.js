Template.livechatCustomFields.helpers({
	customFields() {
		return LivechatCustomField.find();
	}
});

Template.livechatCustomFields.events({
	'click .remove-custom-field'(e) {
		e.preventDefault();
		e.stopPropagation();

		swal({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:removeCustomField', this._id, function(error/*, result*/) {
				if (error) {
					return toastr.error(t(error.reason || error.error));
				}
				swal({
					title: t('Removed'),
					text: t('Field_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	},

	'click .custom-field-info'(e/*, instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-customfield-edit', { _id: this._id });
	}
});

Template.livechatCustomFields.onCreated(function() {
	this.subscribe('livechat:customFields');
});
