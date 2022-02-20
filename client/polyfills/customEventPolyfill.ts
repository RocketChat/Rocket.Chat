((): void => {
	if (typeof window.CustomEvent === 'function') {
		return;
	}

	const CustomEvent = function <T>(
		type: string,
		{ bubbles = false, cancelable = false, detail = null as unknown as T }: CustomEventInit<T> = {},
	): CustomEvent<T> {
		const evt = document.createEvent('CustomEvent') as CustomEvent<T>;
		evt.initCustomEvent(type, bubbles, cancelable, detail);
		return evt;
	} as unknown as {
		prototype: CustomEvent;
		new <T>(typeArg: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>;
	};

	window.CustomEvent = CustomEvent;
})();
