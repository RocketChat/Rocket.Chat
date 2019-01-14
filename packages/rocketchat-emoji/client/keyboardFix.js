import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

if (Meteor.isCordova) {
	window.addEventListener('native.keyboardshow', function() {
		if ((typeof device !== 'undefined' && device !== null ? device.platform.toLowerCase() : false) !== 'android') {
			RocketChat.EmojiPicker.setPosition();
		}
	});
	window.addEventListener('native.keyboardhide', function() {
		if ((typeof device !== 'undefined' && device !== null ? device.platform.toLowerCase() : false) !== 'android') {
			RocketChat.EmojiPicker.setPosition();
		}
	});
}
