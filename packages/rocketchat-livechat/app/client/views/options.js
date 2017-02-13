/* globals Department, Livechat */

Template.options.helpers({
	showDepartments() {
		return Department.find({ showOnRegistration: true }).count() > 1;
	},
	departments() {
		return Department.find({ showOnRegistration: true });
	},
	selectedDepartment() {
		return this._id === Livechat.department;
	}
});

Template.options.events({
	'click .end-chat'() {
		swal({
			text: t('Are_you_sure_do_you_want_end_this_chat'),
			title: '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
			closeOnConfirm: true,
			html: false
		}, () => {
			Meteor.call('livechat:closeByVisitor', (error) => {
				if (error) {
					return console.log('Error ->', error);
				}
			});
		});
	},
	'change .switch-department'(e, instance) {
			Meteor.call('livechat:closeByVisitor', (error) => {
				if (error) {
					return console.log('Error ->', error);
				}

				var departmentId = instance.$('select[name=department]').val();
				if (!departmentId) {
					var department = Department.findOne({ showOnRegistration: true });
					if (department) {
						departmentId = department._id;
					}
				}
				var guestData = {
					token: visitor.getToken(),
					department: Livechat.deparment || departmentId
				};
				Meteor.call('livechat:setDepartmentForVisitor', guestData, (error) => {
					if (error) {
						return console.log('Error ->', error);
					}
				});
		});
	}
});
