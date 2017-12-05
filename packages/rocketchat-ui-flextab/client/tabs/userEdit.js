import toastr from 'toastr';
import s from 'underscore.string';

Template.userEdit.helpers({

	disabled(cursor) {
		return cursor.count() === 0 ? 'disabled' : '';
	},
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
		const roles = Template.instance().roles.get();
		return RocketChat.models.Roles.find({_id: {$nin:roles}, scope: 'Users'}, { sort: { description: 1, _id: 1 } });
	},

	userRoles() {
		return Template.instance().roles.get();
	},

	name() {
		return this.description || this._id;
	}
});

Template.userEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.roles.set([]);
		t.cancel(t.find('form'));
	},

	'click .remove-role'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		let roles = t.roles.get();
		roles = roles.filter(el => el !== this.valueOf());
		t.roles.set(roles);
		$(`[title=${ this }]`).remove();
	},

	'click #randomPassword'(e) {
		e.stopPropagation();
		e.preventDefault();
		$('#password').val(Random.id());
	},

	'click #addRole'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		if ($('#roleSelect').find(':selected').is(':disabled')) {
			return;
		}
		const userRoles = [...instance.roles.get()];
		userRoles.push($('#roleSelect').val());
		instance.roles.set(userRoles);
		$('#roleSelect').val('placeholder');
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	}
});


Template.userEdit.onCreated(function() {
	let userData;
	this.user = this.data != null ? this.data.user : undefined;
	this.roles = this.user ? new ReactiveVar(this.user.roles) : new ReactiveVar([]);


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
		const roleSelect = this.$('.remove-role').toArray();

		if (roleSelect.length > 0) {
			const notSorted = roleSelect.map(role => {
				return role.title;
			});
			//Remove duplicate strings from the array
			userData.roles = notSorted.filter((el, index) => notSorted.indexOf(el) === index);
		}
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

		if (!userData.roles) {
			errors.push('Roles');
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
