(() => {
	if (typeof window.CustomEvent === 'function') {
		return;
	}

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: null };
		const evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.CustomEvent?.prototype || window.Event.prototype;

	window.CustomEvent = CustomEvent;
})();
