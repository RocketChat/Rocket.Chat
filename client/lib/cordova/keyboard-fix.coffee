if Meteor.isCordova
	if device.platform.toLowerCase() isnt 'android'
		document.addEventListener 'deviceready', ->
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);

		window.addEventListener 'native.keyboardshow', ->
			$('.main-content').css 'height', window.innerHeight

		window.addEventListener 'native.keyboardhide', ->
			$('.main-content').css 'height', window.innerHeight