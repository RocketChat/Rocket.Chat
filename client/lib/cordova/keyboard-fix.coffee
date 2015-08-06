if Meteor.isCordova
	window.addEventListener 'deviceready', ->
		cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		cordova.plugins.Keyboard.disableScroll(true);

	window.addEventListener 'native.keyboardshow', ->
		$('.main-content').css 'height', window.innerHeight

	window.addEventListener 'native.keyboardhide', ->
		$('.main-content').css 'height', window.innerHeight