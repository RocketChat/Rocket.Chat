/* globals Department, Livechat */
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import swal from 'sweetalert2';
import visitor from '../../imports/client/visitor';

Template.switchDepartment.helpers({
	departments() {
		return Department.find({
			showOnRegistration: true,
			_id: {
				$ne: Livechat.department,
			},
		});
	},
	error() {
		return Template.instance().error.get();
	},
	showError() {
		return Template.instance().error.get() ? 'show' : '';
	},
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
			text: t('Are_you_sure_do_you_want_switch_the_department'),
			title: '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
			html: false,
		}).then((result) => {
			if (!result.value) {
				return;
			}

			const guestData = {
				roomId: visitor.getRoom(),
				visitorToken: visitor.getToken(),
				departmentId,
			};

			Meteor.call('livechat:setDepartmentForVisitor', guestData, (error, result) => {
				if (error) {
					instance.error.set(error.error);
				} else if (result) {
					instance.error.set();
					Livechat.department = departmentId;
					Livechat.showSwitchDepartmentForm = false;
					swal({
						title: t('Department_switched'),
						type: 'success',
						timer: 2000,
					});
				} else {
					instance.error.set(t('No_available_agents_to_transfer'));
				}
			});
		});
	},

	'click #btnCancel'() {
		Livechat.showSwitchDepartmentForm = false;
	},
});
