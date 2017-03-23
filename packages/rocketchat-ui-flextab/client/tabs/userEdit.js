import toastr from 'toastr';

Template.userEdit.helpers({
	canEditOrAdd() {
		return (Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) || (!Template.instance().user && RocketChat.authz.hasAtLeastOnePermission('create-user'));
	},

	user() {
		return Template.instance().user;
	},

	requirePasswordChange() {
		return !Template.instance().user || Template.instance().user.requirePasswordChange;
	},

	role() {
		return RocketChat.models.Roles.find({}, { sort: { description: 1, _id: 1 } });
	},

	selectUserRole() {
		if (this._id === 'user') {
			return 'selected';
		}
	},

	name() {
		return this.description || this._id;
	}
});

Template.userEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		return t.cancel(t.find('form'));
	},

	'click #randomPassword'(e) {
		e.stopPropagation();
		e.preventDefault();
		return $('#password').val(Random.id());
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();

		return t.save(e.currentTarget);
	}
});

Template.userEdit.onCreated(function() {
	let userData;
	this.user = this.data != null ? this.data.user : undefined;

	const { tabBar } = Template.currentData();

	this.cancel = (form, username) => {
		form.reset();
		this.$('input[type=checkbox]').prop('checked', true);
		if (this.user) {
			return this.data.back(username);
		} else {
			return tabBar.close();
		}
	};

	this.getUserData = () => {
		userData = { _id: (this.user != null ? this.user._id : undefined) };
		userData.name = s.trim(this.$('#name').val());
		userData.username = s.trim(this.$('#username').val());
		userData.email = s.trim(this.$('#email').val());
		userData.verified = this.$('#verified:checked').length > 0;
		userData.password = s.trim(this.$('#password').val());
		userData.requirePasswordChange = this.$('#changePassword:checked').length > 0;
		userData.joinDefaultChannels = this.$('#joinDefaultChannels:checked').length > 0;
		userData.sendWelcomeEmail = this.$('#sendWelcomeEmail:checked').length > 0;
		if (this.$('#role').val()) { userData.roles = [this.$('#role').val()]; }
		return userData;
	};

	this.validate = () => {
		userData = this.getUserData();

		const errors = [];
		if (!userData.name) {
			errors.push('Name');
		}
		if (!userData.username) {
			errors.push('Username');
		}
		if (!userData.email) {
			errors.push('Email');
		}

		for (const error of Array.from(errors)) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		return errors.length === 0;
	};

	return this.save = form => {
		if (this.validate()) {
			userData = this.getUserData();

			if (this.user != null) {
				for (const key in userData) {
					if (key) {
						const value = userData[key];
						if (!['_id'].includes(key)) {
							if (value === this.user[key]) {
								delete userData[key];
							}
						}
					}
				}
			}

			return Meteor.call('insertOrUpdateUser', userData, (error, result) => {
				if (result) {
					if (userData._id) {
						toastr.success(t('User_updated_successfully'));
					} else {
						toastr.success(t('User_added_successfully'));
					}

					this.cancel(form, userData.username);
				}

				if (error) {
					return handleError(error);
				}
			});
		}
	};
});
