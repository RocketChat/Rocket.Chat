RocketChat.Sandstorm = RocketChat.Sandstorm || {};

RocketChat.Sandstorm.request = function() {};
if (Meteor.settings.public.sandstorm) {
	var callbackMap = {};

	var messageListener = function(event) {
		if (event.data.rpcId) {
			var cb = callbackMap[event.data.rpcId];

			cb(event.data.error, event.data);
		}
	};
	window.addEventListener('message', messageListener);

	var interfaces = {
		uiView: 'EAZQAQEAABEBF1EEAQH_5-Jn6pjXtNsAAAA'
	};

	RocketChat.Sandstorm.request = function(interfaceName, cb) {
		var rpcId = Math.random().toString();
		callbackMap[rpcId] = cb;
		window.parent.postMessage({ powerboxRequest: {
			rpcId: rpcId,
			query: [interfaces[interfaceName]]
		}}, '*');
	};
}
