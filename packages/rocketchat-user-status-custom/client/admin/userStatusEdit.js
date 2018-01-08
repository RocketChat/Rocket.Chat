import toastr from 'toastr';
import s from 'underscore.string';

Template.userStatusEdit.helpers({
	userStatus() {
		return Template.instance().userStatus;
	},

	options() {
		const userStatusType = this.userStatus ? this.userStatus.statusType : 'online';

		return [{
			"value": 'online',
			"name": t('Online'),
			"selected": userStatusType === 'online' ? 'selected' : ''
		}, {
			"value": 'away',
			"name": t('Away'),
			"selected": userStatusType === 'away' ? 'selected' : ''
		}, {
			"value" : 'busy',
			"name": t('Busy'),
			"selected": userStatusType === 'busy' ? 'selected' : ''
		}, {
			"value": 'offline',
			"name": t('Invisible'),
			"selected": userStatusType === 'offline' ? 'selected' : ''
		}];
	}
});

Template.userStatusEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.cancel(t.find('form'));
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	}
});

Template.userStatusEdit.onCreated(function() {
	if (this.data != null) {
		this.userStatus = this.data.userStatus;
	} else {
		this.userStatus = undefined;
	}

	this.tabBar = Template.currentData().tabBar;

	this.cancel = (form, name) => {
		form.reset();
		this.tabBar.close();
		if (this.userStatus) {
			this.data.back(name);
		}
	};

	this.getUserStatusData = () => {
		const userStatusData = {};
		if (this.userStatus != null) {
			userStatusData._id = this.userStatus._id;
			userStatusData.previousName = this.userStatus.name;
		}
		userStatusData.name = s.trim(this.$('#name').val());
		userStatusData.statusType = s.trim(this.$('#statusType').val());
		return userStatusData;
	};

	this.validate = () => {
		const userStatusData = this.getUserStatusData();

		const errors = [];
		if (!userStatusData.name) {
			errors.push('Name');
		}
		if (!userStatusData.statusType) {
			errors.push('StatusType');
		}

		for (const error of errors) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (this.validate()) {
			const userStatusData = this.getUserStatusData();

			Meteor.call('insertOrUpdateUserStatus', userStatusData, (error, result) => {
				if (result) {
					if (userStatusData._id) {
						toastr.success(t('Custom_User_Status_Updated_Successfully'));
					} else {
						toastr.success(t('Custom_User_Status_Added_Successfully'));
					}

					this.cancel(form, userStatusData.name);
				}

				if (error) {
					handleError(error);
				}
			});
		}
	};
});
