/* globals Department, Livechat */

Template.switchDepartment.helpers({
	departments() {
		return Department.find({
			showOnRegistration: true,
			_id: {
				$ne: Livechat.department
			}
		});
	},
	error() {
		return Template.instance().error.get();
	},
	showError() {
		return Template.instance().error.get() ? 'show' : '';
	}
});

Template.switchDepartment.onCreated(function() {
	this.error = new ReactiveVar();
});

Template.switchDepartment.events({
	'submit form'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		const departmentId = instance.$('.switch-department-select').val();
		if (!departmentId) {
			instance.error.set(t('Please_choose_a_department'));
			return;
		}

		instance.error.set();
		swal({
			text: t('Are_you_sure_do_you_want_end_this_chat_and_switch_department'),
			title: '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
			closeOnConfirm: true,
			html: false
		}, () => {
			Meteor.call('livechat:closeByVisitor', visitor.getRoom(), (error) => {
				if (error) {
					return console.log('Error ->', error);
				}

				const guestData = {
					token: visitor.getToken(),
					department: departmentId
				};
				Meteor.call('livechat:setDepartmentForVisitor', guestData, (error) => {
					if (error) {
						return console.log('Error ->', error);
					}
					Livechat.department = departmentId;
					Livechat.showSwitchDepartmentForm = false;
					swal({
						title: t('Department_switched'),
						type: 'success',
						timer: 2000
					});
				});
			});
		});
	},

	'click #btnCancel'() {
		Livechat.showSwitchDepartmentForm = false;
	}
});
