Meteor.methods({
	addApplication(application) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
			throw new Meteor.Error('not_authorized');
		}

		const isValid = RocketChat.Application.Validator.validate(application);

		if (isValid !== true) {
			console.log(isValid);
			throw new Meteor.Error('invalid_application', isValid);
		}

		application.type = 'application';
		application.status = 'configuring';
		application._createdAt = new Date;
		application._createdBy = _.pick(Meteor.user(), '_id', 'username');

		application._id = RocketChat.models.Integrations.insert(application);

		return;
	}
});
