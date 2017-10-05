RocketChat.Sandstorm = RocketChat.Sandstorm || {};

RocketChat.Sandstorm.request = function() {};
if (Meteor.settings.public.sandstorm) {
	const callbackMap = {};

	const messageListener = function(event) {
		if (event.data.rpcId) {
			const cb = callbackMap[event.data.rpcId];

			cb(event.data.error, event.data);
		}
	};
	window.addEventListener('message', messageListener);

	const interfaces = {
		uiView: 'EAZQAQEAABEBF1EEAQH_5-Jn6pjXtNsAAAA'
	};

	RocketChat.Sandstorm.request = function(interfaceName, cb) {
		const rpcId = Math.random().toString();
		callbackMap[rpcId] = cb;
		window.parent.postMessage({ powerboxRequest: {
			rpcId,
			query: [interfaces[interfaceName]]
		}}, '*');
	};
}
