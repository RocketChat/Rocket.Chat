/* globals Department, Livechat */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import swal from 'sweetalert2';
import visitor from '../../imports/client/visitor';

Template.options.helpers({
	showDepartments() {
		return Livechat.allowSwitchingDepartments && Department.find({ showOnRegistration: true }).count() > 1;
	},
	departments() {
		return Department.find({ showOnRegistration: true });
	},
	selectedDepartment() {
		return this._id === Livechat.department;
	},
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
			html: false,
		}).then((result) => {
			if (result.value) {
				Meteor.call('livechat:closeByVisitor', { roomId: visitor.getRoom(), token: visitor.getToken() }, (error) => {
					if (error) {
						return console.log('Error ->', error);
					}
				});
			}
		});
	},
	'click .switch-department'() {
		Livechat.showSwitchDepartmentForm = true;
	},
});
