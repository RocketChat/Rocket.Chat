/* globals AuditLog */

Meteor.startup(function() {
	// Assign audit log for users collection
	AuditLog.assignCallbacks(Meteor.users, { omit: [
		'_updatedAt',
		'status',
		'statusConnection',
		'active',
		'verificationTokens',
		'loginTokens',
		'utcOffset',
		'statusDefault'
	]});
});
