import { Meteor } from 'meteor/meteor';

Meteor.publish('personalAccessTokens', function() {
	if (!this.userId) {
		return this.ready();
	}
	if (!RocketChat.authz.hasPermission(this.userId, 'create-personal-access-tokens')) {
		return this.ready();
	}
	const self = this;
	const getFieldsToPublish = (fields) => fields.services.resume.loginTokens
		.filter((loginToken) => loginToken.type && loginToken.type === 'personalAccessToken')
		.map((loginToken) => ({
			name: loginToken.name,
			createdAt: loginToken.createdAt,
			lastTokenPart: loginToken.lastTokenPart,
		}));
	const handle = RocketChat.models.Users.getLoginTokensByUserId(this.userId).observeChanges({
		added(id, fields) {
			self.added('personal_access_tokens', id, { tokens: getFieldsToPublish(fields) });
		},
		changed(id, fields) {
			self.changed('personal_access_tokens', id, { tokens: getFieldsToPublish(fields) });
		},
		removed(id) {
			self.removed('personal_access_tokens', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
