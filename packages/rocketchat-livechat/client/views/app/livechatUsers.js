var ManagerUsers;

Meteor.startup(function() {
	ManagerUsers = new Mongo.Collection('managerUsers');
});

Template.livechatUsers.helpers({
	managers() {
		return ManagerUsers.find({}, { sort: { name: 1 } });
	},
	agents() {
		return AgentUsers.find({}, { sort: { name: 1 } });
	},
	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	}
});

Template.livechatUsers.events({
	'click .remove-manager' (e/*, instance*/) {
		e.preventDefault();

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
			Meteor.call('livechat:removeManager', this.username, function(error/*, result*/) {
				if (error) {
					return toastr.error(t(error.reason || error.error));
				}
				swal({
					title: t('Removed'),
					text: t('Manager_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},
	'click .remove-agent' (e/*, instance*/) {
		e.preventDefault();

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
			Meteor.call('livechat:removeAgent', this.username, function(error/*, result*/) {
				if (error) {
					return toastr.error(t(error.reason || error.error));
				}
				swal({
					title: t('Removed'),
					text: t('Agent_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},
	'submit #form-manager' (e/*, instance*/) {
		e.preventDefault();

		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		var oldBtnValue = e.currentTarget.elements.add.value;

		e.currentTarget.elements.add.value = t('Saving');

		Meteor.call('livechat:addManager', e.currentTarget.elements.username.value, function(error/*, result*/) {
			e.currentTarget.elements.add.value = oldBtnValue;
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Manager_added'));
			e.currentTarget.reset();
		});
	},
	'submit #form-agent' (e/*, instance*/) {
		e.preventDefault();

		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		var oldBtnValue = e.currentTarget.elements.add.value;

		e.currentTarget.elements.add.value = t('Saving');

		Meteor.call('livechat:addAgent', e.currentTarget.elements.username.value, function(error/*, result*/) {
			e.currentTarget.elements.add.value = oldBtnValue;
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Agent_added'));
			e.currentTarget.reset();
		});
	}
});

Template.livechatUsers.onCreated(function() {
	this.subscribe('livechat:agents');
	this.subscribe('livechat:managers');
});
