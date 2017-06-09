this.parentCall = (method, args = []) => {
	const data = {
		src: 'rocketchat',
		fn: method,
		args
	};

	window.parent.postMessage(data, '*');
};
