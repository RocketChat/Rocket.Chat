/**
 * This file is part of https://github.com/martynsmith/node-irc
 * by https://github.com/martynsmith
 */

const replyFor = require('./codes');

/**
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 * @param {String} line Raw message from IRC server.
 * @return {Object} A parsed message object.
 */
module.exports = function parseMessage(line) {
	const message = {};
	let match;

	// Parse prefix
	match = line.match(/^:([^ ]+) +/);
	if (match) {
		message.prefix = match[1];
		line = line.replace(/^:[^ ]+ +/, '');
		match = message.prefix.match(/^([_a-zA-Z0-9\~\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/);
		if (match) {
			message.nick = match[1];
			message.user = match[3];
			message.host = match[4];
		} else {
			message.server = message.prefix;
		}
	}

	// Parse command
	match = line.match(/^([^ ]+) */);
	message.command = match[1];
	message.rawCommand = match[1];
	message.commandType = 'normal';
	line = line.replace(/^[^ ]+ +/, '');

	if (replyFor[message.rawCommand]) {
		message.command = replyFor[message.rawCommand].name;
		message.commandType = replyFor[message.rawCommand].type;
	}

	message.args = [];
	let middle;
	let trailing;

	// Parse parameters
	if (line.search(/^:|\s+:/) !== -1) {
		match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
		middle = match[1].trimRight();
		trailing = match[2];
	} else {
		middle = line;
	}

	if (middle.length) {
		message.args = middle.split(/ +/);
	}

	if (typeof trailing !== 'undefined' && trailing.length) {
		message.args.push(trailing);
	}

	return message;
};
