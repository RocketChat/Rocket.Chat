@parentCall = (method, args = []) ->
	data =
		src: 'rocketchat'
		fn: method
		args: args

	window.parent.postMessage data, '*'
