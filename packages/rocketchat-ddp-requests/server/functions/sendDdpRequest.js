import _ from 'underscore';

const requestStream = new Meteor.Streamer('ddp-requests');

/**
 * Sends a ddpRequest object to the user via the ddp-requests stream
 * @param {Object} user Object of the target user
 * @param {Object} request request to be sent, must have a 'key' property of type String
 * @param {Number} timeout Number of seconds until timeout, defaults to 5
 */
RocketChat.sendDdpRequest = (user, request, timeout = 5) => {
	const promise = new Promise((resolve, reject) => {
		check(user, Object);
		check(request, Object);
		check(request.key, String);
		check(timeout, Number);

		// Must have the _id and username properties
		if (user._id === undefined || user.username === undefined) {
			const error = new Meteor.Error('error-invalid-user', 'Invalid user', {
				function: 'sendDdpRequest',
			});
			return reject(error);
		}

		const msTimeout = timeout * 1000;

		const ddpRequest = request;
		ddpRequest._id = Random.id();
		ddpRequest.ts = new Date();

		// rejects with timeout error if timeout was not cleared after response
		const timeoutFunction = setTimeout(() => {
			RocketChat.removeAllListeners(`ddp-request-response-${ ddpRequest._id }`);
			const error = new Meteor.Error('error-ddp-request-response-timeout',
				`${ _.escape(user.name) } didn't respond to the request in time`, {
					method: 'sendDdpRequest',
					request: ddpRequest,
				});
			reject(error);
		}, msTimeout);

		// adds listener for a response event coming from replyToDdpRequest
		// if the response times out, the listener is removed by timeoutFunction
		RocketChat.on(`ddp-request-response-${ ddpRequest._id }`, (replyUser, response) => {
			if (user._id !== replyUser._id) {
				return;
			}
			clearTimeout(timeoutFunction);
			RocketChat.removeAllListeners(`ddp-request-response-${ ddpRequest._id }`);
			resolve(response);
		});

		// emits the request to the user
		requestStream.emit(user._id, ddpRequest);
	});

	return promise;
};
