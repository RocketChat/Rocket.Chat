import _ from 'underscore';

Meteor.methods({
	'robot.modelCall'(model, method, args) {
		check(model, String);
		check(method, String);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'robot.modelCall'
			});
		}
		if (!RocketChat.authz.hasRole(Meteor.userId(), 'robot')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'robot.modelCall'
			});
		}
		const m = RocketChat.models[model];

		if (!m || !_.isFunction(m[method])) {
			throw new Meteor.Error('error-invalid-method', 'Invalid method', {
				method: 'robot.modelCall'
			});
		}
		const cursor = RocketChat.models[model][method].apply(RocketChat.models[model], args);
		return cursor && cursor.fetch ? cursor.fetch() : cursor;
	}
});
