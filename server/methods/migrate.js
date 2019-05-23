import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Migrations } from '../../app/migrations';
import { hasPermission } from '../../app/authorization';

Meteor.methods({
	migrateTo(version) {
		check(version, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'migrateTo',
			});
		}

		const user = Meteor.user();

		if (!user || hasPermission(user._id, 'run-migration') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'migrateTo',
			});
		}

		this.unblock();

		Migrations.migrateTo(version);

		return version;
	},

	getMigrationVersion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getMigrationVersion',
			});
		}

		return Migrations.getVersion();
	},
});
