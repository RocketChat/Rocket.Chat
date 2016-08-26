window.fireGlobalEvent = (eventName, params) => {
	window.dispatchEvent(new CustomEvent(eventName, {detail: params}));

	if (RocketChat.settings.get('Iframe_Integration_send_enable') === true) {
		parent.postMessage({
			eventName: eventName,
			data: params
		}, RocketChat.settings.get('Iframe_Integration_send_target_origin'));
	}
};

window.addEventListener('message', (e) => {
	if (RocketChat.settings.get('Iframe_Integration_receive_enable') !== true) {
		return;
	}

	if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
		return;
	}

	let origins = RocketChat.settings.get('Iframe_Integration_receive_origin');

	if (origins !== '*' && origins.split(',').indexOf(e.origin) === -1) {
		return console.error('Origin not allowed', e.origin);
	}

	switch (e.data.externalCommand) {
		case 'go':
			if (typeof e.data.path !== 'string' || e.data.path.trim().length === 0) {
				return console.error('`path` not defined');
			}
			FlowRouter.go(e.data.path);
			break;
	}
});
