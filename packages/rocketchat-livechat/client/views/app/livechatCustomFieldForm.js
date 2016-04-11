Template.livechatCustomFieldForm.helpers({
	customField() {
		return Template.instance().customField.get();
	}
});

Template.livechatCustomFieldForm.events({
	'submit #customField-form' (e, instance) {
		e.preventDefault();
		var $btn = instance.$('button.save');

		var _id = $(e.currentTarget).data('id');
		var field = instance.$('input[name=field]').val();
		var label = instance.$('input[name=label]').val();
		var scope = instance.$('select[name=scope]').val();
		var visibility = instance.$('select[name=visibility]').val();

		if (!/^[0-9a-zA-Z-_]+$/.test(field)) {
			return toastr.error(t('error-invalid-custom-field-name'));
		}

		if (label.trim() === '') {
			return toastr.error(t('Please_fill_a_label'));
		}

		var oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		var customFieldData = {
			field: field,
			label: label,
			scope: scope.trim(),
			visibility: visibility.trim()
		};

	Meteor.call('livechat:saveCustomField', _id, customFieldData, function(error) {
			$btn.html(oldBtnValue);
			if (error) {
				return toastr.error(t(error.error));
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-customfields');
		});
	},

	'click button.back' (e/*, instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-customfields');
	}
});

Template.livechatCustomFieldForm.onCreated(function() {
	this.customField = new ReactiveVar({});
	this.autorun(() => {
		var sub = this.subscribe('livechat:customFields', FlowRouter.getParam('_id'));
		if (sub.ready()) {
			const customField = LivechatCustomField.findOne({ _id: FlowRouter.getParam('_id') });
			if (customField) {
				this.customField.set(customField);
			}
		}
	});
});
