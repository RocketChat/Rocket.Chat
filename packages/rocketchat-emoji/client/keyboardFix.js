import { Meteor } from 'meteor/meteor';
import { EmojiPicker } from './lib/EmojiPicker';

if (Meteor.isCordova) {
	window.addEventListener('native.keyboardshow', function() {
		if ((typeof device !== 'undefined' && device !== null ? device.platform.toLowerCase() : false) !== 'android') {
			EmojiPicker.setPosition();
		}
	});
	window.addEventListener('native.keyboardhide', function() {
		if ((typeof device !== 'undefined' && device !== null ? device.platform.toLowerCase() : false) !== 'android') {
			EmojiPicker.setPosition();
		}
	});
}
