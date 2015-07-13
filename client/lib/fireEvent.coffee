window.fireGlobalEvent = (eventName, params) ->
	window.dispatchEvent new CustomEvent(eventName, {detail: params})