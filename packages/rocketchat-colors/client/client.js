import s from 'underscore.string';

//
// HexColorPreview is a named function that will process Colors
// @param {Object} message - The message object
//

function HexColorPreview(message) {
	let msg;
	if (s.trim(message.html) && RocketChat.settings.get('HexColorPreview_Enabled')) {
		msg = message.html;
		msg = msg.replace(/(?:^|\s|\n)(#[A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?)\b/g, function(match, completeColor) {
			return match.replace(completeColor, `<div class="message-color"><div class="message-color-sample" style="background-color:${ completeColor }"></div>${ completeColor.toUpperCase() }</div>`);
		});
		message.html = msg;
	}
	return message;
}

RocketChat.callbacks.add('renderMessage', HexColorPreview, RocketChat.callbacks.priority.MEDIUM);
