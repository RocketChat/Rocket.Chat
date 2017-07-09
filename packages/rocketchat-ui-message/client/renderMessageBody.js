/* global renderMessageBody:true */

renderMessageBody = function(msg) {
	msg.html = msg.msg;
	msg = RocketChat.callbacks.run('renderMessage', msg);
	return msg.html;
};

/* exported renderMessageBody */
