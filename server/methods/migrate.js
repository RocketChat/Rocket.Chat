Meteor.methods({
	migrateTo(version) {
		check(version, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'migrateTo'
			});
		}

		const user = Meteor.user();

		if (!user || RocketChat.authz.hasPermission(user._id, 'run-migration') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'migrateTo'
			});
		}

		this.unblock();

		RocketChat.Migrations.migrateTo(version);

		return version;
	},

	getMigrationVersion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getMigrationVersion'
			});
		}

		return RocketChat.Migrations.getVersion();
	}
});
