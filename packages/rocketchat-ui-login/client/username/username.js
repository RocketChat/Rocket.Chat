Template.username.onCreated(function() {
	const self = this;
	self.username = new ReactiveVar;

	return Meteor.call('getUsernameSuggestion', function(error, username) {
		self.username.set({
			ready: true,
			username
		});
		return Meteor.defer(() => self.find('input').focus());
	});
});

Template.username.helpers({
	username() {
		return Template.instance().username.get();
	}
});

Template.username.events({
	'focus .input-text input'(event) {
		return $(event.currentTarget).parents('.input-text').addClass('focus');
	},

	'blur .input-text input'(event) {
		if (event.currentTarget.value === '') {
			return $(event.currentTarget).parents('.input-text').removeClass('focus');
		}
	},

	'submit #login-card'(event, instance) {
		event.preventDefault();

		const username = instance.username.get();
		username.empty = false;
		username.error = false;
		username.invalid = false;
		instance.username.set(username);

		const button = $(event.target).find('button.login');
		RocketChat.Button.loading(button);

		const value = $('#username').val().trim();
		if (value === '') {
			username.empty = true;
			instance.username.set(username);
			RocketChat.Button.reset(button);
			return;
		}

		return Meteor.call('setUsername', value, function(err) {
			if (err != null) {
				console.log(err);
				if (err.error === 'username-invalid') {
					username.invalid = true;
				} else {
					username.error = true;
				}
				username.username = value;
			}

			RocketChat.Button.reset(button);
			instance.username.set(username);
			return RocketChat.callbacks.run('usernameSet');
		});
	}
});
