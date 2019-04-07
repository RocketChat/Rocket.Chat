import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../../app/authorization';
import { Users } from '../../../../app/models';

Meteor.publish('personalAccessTokens', function() {
	if (!this.userId) {
		return this.ready();
	}
	if (!hasPermission(this.userId, 'create-personal-access-tokens')) {
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
	const handle = Users.getLoginTokensByUserId(this.userId).observeChanges({
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
