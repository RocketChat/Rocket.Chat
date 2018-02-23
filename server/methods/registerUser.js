import s from 'underscore.string';

Meteor.methods({
	registerUser(formData) {
		const AllowAnonymousRead = RocketChat.settings.get('Accounts_AllowAnonymousRead');
		const AllowAnonymousWrite = RocketChat.settings.get('Accounts_AllowAnonymousWrite');
		const manuallyApproveNewUsers = RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');
		if (AllowAnonymousRead === true && AllowAnonymousWrite === true && formData.email == null) {
			const userId = Accounts.insertUserDoc({}, {
				globalRoles: [
					'anonymous'
				]
			});

			const { id, token } = Accounts._loginUser(this, userId);

			return { id, token };
		} else {
			check(formData, Match.ObjectIncluding({
				email: String,
				pass: String,
				name: String,
				secretURL: Match.Optional(String),
				reason: Match.Optional(String)
			}));
		}

		if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Disabled') {
			throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', { method: 'registerUser' });
		} else if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Secret URL' && (!formData.secretURL || formData.secretURL !== RocketChat.settings.get('Accounts_RegistrationForm_SecretURL'))) {
			throw new Meteor.Error ('error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' });
		}

		RocketChat.validatePasswordPolicy(formData.pass);

		RocketChat.validateEmailDomain(formData.email);

		const userData = {
			email: s.trim(formData.email.toLowerCase()),
			password: formData.pass,
			name: formData.name,
			reason: formData.reason
		};

		// Check if user has already been imported and never logged in. If so, set password and let it through
		const importedUser = RocketChat.models.Users.findOneByEmailAddress(s.trim(formData.email.toLowerCase()));
		let userId;
		if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
			Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else {
			userId = Accounts.createUser(userData);
		}

		RocketChat.models.Users.setName(userId, s.trim(formData.name));

		const reason = s.trim(formData.reason);
		if (manuallyApproveNewUsers && reason) {
			RocketChat.models.Users.setReason(userId, reason);
		}

		RocketChat.saveCustomFields(userId, formData);

		try {
			if (RocketChat.settings.get('Verification_Customized')) {
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');
				Accounts.emailTemplates.verifyEmail.subject = () => subject;
				Accounts.emailTemplates.verifyEmail.html = (userModel, url) => html.replace(/\[Verification_Url]/g, url);
			}

			Accounts.sendVerificationEmail(userId, userData.email);
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}

		return userId;
	}
});
