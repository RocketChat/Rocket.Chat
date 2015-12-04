Template.livechatDepartmentForm.helpers({
	department() {
		return Template.instance().department || { enabled: true };
	}
});

Template.livechatDepartmentForm.events({
	'submit #department-form' (e, instance) {
		e.preventDefault();
		var $btn = instance.$('button.save');

		var _id = $(e.currentTarget).data('id');
		var enabled = instance.$('input[name=enabled]:checked').val()
		var name = instance.$('input[name=name]').val()
		var description = instance.$('textarea[name=description]').val()

		if (enabled !== "1" && enabled !== "0") {
			return toastr.error(t('Please_select_enabled_yes_or_no'));
		}

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		var oldBtnValue = $btn.val();
		$btn.val(t('Saving'));

		departmentData = {
			enabled: enabled === "1" ? true : false,
			name: name.trim(),
			description: description.trim()
		}

		Meteor.call('livechat:saveDepartment', _id, departmentData, function(error, result) {
			$btn.val(oldBtnValue);
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-departments');
		});
	},

	'click button.back' () {
		event.preventDefault();
		FlowRouter.go('livechat-departments');
	}
});

Template.livechatDepartmentForm.onCreated(function() {
	this.department = LivechatDepartment.findOne({ _id: FlowRouter.getParam('_id') });
	this.subscribe('livechat:departments', FlowRouter.getParam('_id'));
});
