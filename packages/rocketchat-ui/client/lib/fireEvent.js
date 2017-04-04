window.fireGlobalEvent = (eventName, params) => {
	window.dispatchEvent(new CustomEvent(eventName, {detail: params}));

	if (RocketChat.settings.get('Iframe_Integration_send_enable') === true) {
		parent.postMessage({
			eventName,
			data: params
		}, RocketChat.settings.get('Iframe_Integration_send_target_origin'));
	}
};
