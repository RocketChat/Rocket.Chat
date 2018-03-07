import toastr from 'toastr';

Template.ChatpalAdmin.onCreated(function() {

	const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	this.validateEmail = (email) => {
		return re.test(email.toLowerCase());
	};

	this.apiKey = new ReactiveVar();
});

Template.ChatpalAdmin.onRendered(function() {
	this.$('#chatpal-tac').load('https://cerbot.redlink.io/public/tac.html');
});

Template.ChatpalAdmin.events({
	'submit form'(e, t) {
		e.preventDefault();

		const email = e.target.email.value;
		const tac = e.target.readtac.checked;

		if (!tac) { return toastr.error(TAPi18n.__('CHATPAL_MSG_ERROR_TAC_MUST_BE_CHECKED')); }
		if (!email || email === '') { return toastr.error(TAPi18n.__('CHATPAL_MSG_ERROR_EMAIL_MUST_BE_SET')); }
		if (!t.validateEmail(email)) { return toastr.error(TAPi18n.__('CHATPAL_MSG_ERROR_EMAIL_MUST_BE_VALID')); }

		//TODO register
		try {
			Meteor.call('chatpalUtilsCreateKey', email, (err, key) => {
				if (!key) { return toastr.error(TAPi18n.__('CHATPAL_MSG_ERROR_USERNAME_ALREADY_EXISTS')); }

				toastr.info(TAPi18n.__('CHATPAL_MSG_KEY_CREATED_SUCCESSFULLY'));

				t.apiKey.set(key);
			});

		} catch (e) {
			console.log(e);
			toastr.error(TAPi18n.__('CHATPAL_MSG_ERROR_USERNAME_ALREADY_EXISTS'));//TODO error messages
		}
	}
});

//template
Template.ChatpalAdmin.helpers({
	apiKey() {
		return Template.instance().apiKey.get();
	},
	isAdmin() {
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin');
	}
});
