if Meteor.isCordova
	document.addEventListener 'deviceready', ->
		if device?.platform.toLowerCase() isnt 'android'
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);

	window.addEventListener 'native.keyboardshow', ->
		if device?.platform.toLowerCase() isnt 'android'
			if Meteor.userId()?
				$('.main-content').css 'height', window.innerHeight
				$('.sweet-alert').css 'transform', "translateY(-#{(document.height - window.innerHeight) / 2}px)"
				$('.sweet-alert').css '-webkit-transform', "translateY(-#{(document.height - window.innerHeight) / 2}px)"
			else
				$(document.body).css 'height', window.innerHeight
				$(document.body).css 'overflow', 'scroll'

	window.addEventListener 'native.keyboardhide', ->
		if device?.platform.toLowerCase() isnt 'android'
			if Meteor.userId()?
				$('.main-content').css 'height', window.innerHeight
				$('.sweet-alert').css 'transform', ''
				$('.sweet-alert').css '-webkit-transform', ''
			else
				$(document.body).css 'height', window.innerHeight
				$(document.body).css 'overflow', 'visible'
