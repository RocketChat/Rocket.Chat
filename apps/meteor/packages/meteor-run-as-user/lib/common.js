/**
 * Run as a user
 * @param  {String} userId The id of user to run as
 * @param  {Function} f      Function to run as user
 * @return {Any} Returns function result
 */
Meteor.runAsUser = function (userId, f) {
	var currentInvocation = DDP._CurrentInvocation.get();

	// Create a new method invocation
	var invocation = new DDPCommon.MethodInvocation(
		currentInvocation
			? currentInvocation
			: {
					connection: null,
				},
	);

	// Now run as user on this invocation
	invocation.setUserId(userId);

	return DDP._CurrentInvocation.withValue(invocation, function () {
		return f.apply(invocation, [userId]);
	});
};
