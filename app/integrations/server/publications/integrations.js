import { Meteor } from 'meteor/meteor';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization';
import { Integrations } from '../../../models';

Meteor.publish('integrations', function _integrationPublication() {
	if (!this.userId) {
		return this.ready();
	}

	if(!hasAtLeastOnePermission(this.userId, [
		'manage-outgoing-integrations',
		'manage-own-outgoing-integrations',
		'manage-incoming-integrations',
		'manage-own-incoming-integrations',
	])) {
		throw new Meteor.Error('not-authorized');
	}

	const canViewAllOutgoingIntegrations = hasPermission(this.userId, 'manage-outgoing-integrations');
	const canViewAllIncomingIntegrations = hasPermission(this.userId, 'manage-incoming-integrations');
	const canViewOnlyOwnOutgoingIntegrations = hasPermission(this.userId, 'manage-own-outgoing-integrations');
	const canViewOnlyOwnIncomingIntegrations = hasPermission(this.userId, 'manage-own-incoming-integrations');

	if (canViewAllIncomingIntegrations && canViewAllOutgoingIntegrations) {
		return Integrations.find();
	}
	if (canViewAllOutgoingIntegrations) {
		return Integrations.find({ 'type': 'webhook-outgoing' });
	}
	if (canViewAllIncomingIntegrations) {
		return Integrations.find({ 'type': 'webhook-incoming' });
	}
	if (canViewOnlyOwnOutgoingIntegrations && canViewOnlyOwnIncomingIntegrations) {
		return Integrations.find({ '_createdBy._id': this.userId });
	}
	if (canViewOnlyOwnOutgoingIntegrations) {
		return Integrations.find({ '_createdBy._id': this.userId, 'type': 'webhook-outgoing' });
	}
	if (canViewOnlyOwnIncomingIntegrations) {
		return Integrations.find({ '_createdBy._id': this.userId, 'type': 'webhook-incoming' });
	}	
});
