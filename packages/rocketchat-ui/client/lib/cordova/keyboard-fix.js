/* globals device cordova*/
if (Meteor.isCordova) {
	const body = $(document.body);
	document.addEventListener('deviceready', function() {
		if (typeof device !== 'undefined' && device !== null && device.platform.toLowerCase() !== 'android') {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			return cordova.plugins.Keyboard.disableScroll(true);
		}
	});
	window.addEventListener('native.keyboardshow', function() {
		if (typeof device !== 'undefined' && device !== null && device.platform.toLowerCase() !== 'android') {
			if (Meteor.userId() != null) {
				$('.main-content').css('height', window.innerHeight);
				$('.sweet-alert').css('transform', `translateY(-${ (document.height - window.innerHeight) / 2 }px)`).css('-webkit-transform', `translateY(-${ (document.height - window.innerHeight) / 2 }px)`);
			} else {
				body.css('height', window.innerHeight);
				body.css('overflow', 'scroll');
			}
		}
	});
	window.addEventListener('native.keyboardhide', function() {
		if (typeof device !== 'undefined' && device !== null && device.platform.toLowerCase() !== 'android') {
			if (Meteor.userId() != null) {
				$('.main-content').css('height', window.innerHeight);
				$('.sweet-alert').css('transform', '').css('-webkit-transform', '');
			} else {
				body.css('height', window.innerHeight);
				body.css('overflow', 'visible');
			}
		}
	});
}
