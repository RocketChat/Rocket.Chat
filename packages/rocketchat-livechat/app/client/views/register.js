Template.register.helpers({
	error() {
		return Template.instance().error.get();
	},
	welcomeMessage() {
		return '';
	},
	hasDepartments() {
		return Department.find().count() > 1;
	},
	departments() {
		return Department.find();
	}
});

Template.register.events({
	'submit #livechat-registration' (e, instance) {
		var $email, $name;
		e.preventDefault();
		$name = instance.$('input[name=name]');
		$email = instance.$('input[name=email]');
		if (!($name.val().trim() && $email.val().trim())) {
			return instance.showError(TAPi18n.__('Please_fill_name_and_email'));
		} else {
			var departmentId = instance.$('select[name=department]').val();
			if (!departmentId) {
				var department = Department.findOne();
				if (department) {
					departmentId = department._id;
				}
			}

			var guest = {
				token: visitor.getToken(),
				name: $name.val(),
				email: $email.val(),
				department: departmentId
			};
			Meteor.call('livechat:registerGuest', guest, function(error, result) {
				if (error != null) {
					return instance.showError(error.reason);
				}
				Meteor.loginWithToken(result.token, function(error) {
					if (error) {
						return instance.showError(error.reason);
					}
				});
			});
		}
	},
	'click .error' (e, instance) {
		return instance.hideError();
	}
});

Template.register.onCreated(function() {
	this.subscribe('livechat:availableDepartments');

	this.error = new ReactiveVar();
	this.showError = (msg) => {
		$('.error').addClass('show');
		this.error.set(msg);
	};
	this.hideError = () => {
		$('.error').removeClass('show');
		this.error.set();
	};
});
