import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { Integrations, Users } from '/app/models';
import { integrations } from '../../../lib/rocketchat';

Meteor.methods({
	updateOutgoingIntegration(integrationId, integration) {
		integration = integrations.validateOutgoing(integration, this.userId);

		if (!integration.token || integration.token.trim() === '') {
			throw new Meteor.Error('error-invalid-token', 'Invalid token', { method: 'updateOutgoingIntegration' });
		}

		let currentIntegration;

		if (hasPermission(this.userId, 'manage-integrations')) {
			currentIntegration = Integrations.findOne(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-integrations')) {
			currentIntegration = Integrations.findOne({ _id: integrationId, '_createdBy._id': this.userId });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'updateOutgoingIntegration' });
		}

		if (!currentIntegration) {
			throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
		}

		Integrations.update(integrationId, {
			$set: {
				event: integration.event,
				enabled: integration.enabled,
				name: integration.name,
				avatar: integration.avatar,
				emoji: integration.emoji,
				alias: integration.alias,
				channel: integration.channel,
				targetRoom: integration.targetRoom,
				impersonateUser: integration.impersonateUser,
				username: integration.username,
				userId: integration.userId,
				urls: integration.urls,
				token: integration.token,
				script: integration.script,
				scriptEnabled: integration.scriptEnabled,
				scriptCompiled: integration.scriptCompiled,
				scriptError: integration.scriptError,
				triggerWords: integration.triggerWords,
				retryFailedCalls: integration.retryFailedCalls,
				retryCount: integration.retryCount,
				retryDelay: integration.retryDelay,
				triggerWordAnywhere: integration.triggerWordAnywhere,
				runOnEdits: integration.runOnEdits,
				_updatedAt: new Date(),
				_updatedBy: Users.findOne(this.userId, { fields: { username: 1 } }),
			},
		});

		return Integrations.findOne(integrationId);
	},
});
