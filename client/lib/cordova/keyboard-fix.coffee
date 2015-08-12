if Meteor.isCordova
	document.addEventListener 'deviceready', ->
		if device?.platform.toLowerCase() isnt 'android'
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);

	window.addEventListener 'native.keyboardshow', ->
		if device?.platform.toLowerCase() isnt 'android'
			if Meteor.userId()?
				$('.main-content').css 'height', window.innerHeight
			else
				$(document.body).css 'height', window.innerHeight
				$(document.body).css 'overflow', 'scroll'

	window.addEventListener 'native.keyboardhide', ->
		if device?.platform.toLowerCase() isnt 'android'
			if Meteor.userId()?
				$('.main-content').css 'height', window.innerHeight
			else
				$(document.body).css 'height', window.innerHeight
				$(document.body).css 'overflow', 'visible'