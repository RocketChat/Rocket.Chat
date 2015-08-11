if Meteor.isCordova
	document.addEventListener 'deviceready', ->
		if device?.platform.toLowerCase() isnt 'android'
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);

	window.addEventListener 'native.keyboardshow', ->
		if device?.platform.toLowerCase() isnt 'android'
			$('.main-content').css 'height', window.innerHeight

	window.addEventListener 'native.keyboardhide', ->
		if device?.platform.toLowerCase() isnt 'android'
			$('.main-content').css 'height', window.innerHeight