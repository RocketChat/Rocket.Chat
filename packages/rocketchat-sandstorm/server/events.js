RocketChat.Sandstorm = {};

RocketChat.Sandstorm.notify = function() {};

if (process.env.SANDSTORM === '1') {
	var Future = Npm.require('fibers/future');
	var Capnp = Npm.require('capnp');
	var SandstormHttpBridge = Npm.require('sandstorm/sandstorm-http-bridge.capnp').SandstormHttpBridge;

	var capnpConnection = null;
	var httpBridge = null;

	var getHttpBridge = function() {
		if (!httpBridge) {
			capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');
			httpBridge = capnpConnection.restore(null, SandstormHttpBridge);
		}
		return httpBridge;
	};

	var ACTIVITY_TYPES = {
		'message': 0,
		'privateMessage': 1
	};

	var promiseToFuture = function(promise) {
		const result = new Future();
		promise.then(result.return.bind(result), result.throw.bind(result));
		return result;
	};

	var waitPromise = function(promise) {
		return promiseToFuture(promise).wait();
	};

	RocketChat.Sandstorm.notify = function(message, userIds, caption, type) {
		var sessionId = message.sandstormSessionId;
		if (!sessionId) {
			return;
		}
		var httpBridge = getHttpBridge();
		var activity = {};

		if (type) {
			activity.type = ACTIVITY_TYPES[type];
		}

		if (caption) {
			activity.notification = {caption: {defaultText: caption}};
		}

		if (userIds) {
			activity.users = _.map(userIds, function(userId) {
				var user = Meteor.users.findOne({_id: userId}, {fields: {'services.sandstorm.id': 1}});
				return {
					identity: httpBridge.getSavedIdentity(user.services.sandstorm.id).identity,
					mentioned: true
				};
			});
		}

		return waitPromise(httpBridge.getSessionContext(sessionId).context.activity(activity));
	};
}
