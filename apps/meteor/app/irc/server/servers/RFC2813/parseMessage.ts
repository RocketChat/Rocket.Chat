/**
 * This file is part of https://github.com/martynsmith/node-irc
 * by https://github.com/martynsmith
 */

import replyFor from './codes';

type ParsedMessage = {
	prefix?: string;
	nick?: string;
	user?: string;
	host?: string;
	server?: string;
	command: string;
	rawCommand: string;
	commandType: string;
	args: string[];
};

/**
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 * @param {String} line Raw message from IRC server.
 * @return {Object} A parsed message object.
 */
export default function parseMessage(line: string): ParsedMessage {
	const message: Partial<ParsedMessage> = {};
	let match: RegExpMatchArray | null;

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
	message.command = match![1];
	message.rawCommand = match![1];
	message.commandType = 'normal';
	line = line.replace(/^[^ ]+ +/, '');

	if (replyFor[message.rawCommand as keyof typeof replyFor]) {
		message.command = replyFor[message.rawCommand as keyof typeof replyFor].name;
		message.commandType = replyFor[message.rawCommand as keyof typeof replyFor].type;
	}

	message.args = [];
	let middle: string;
	let trailing: string | undefined;

	// Parse parameters
	if (line.search(/^:|\s+:/) !== -1) {
		match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
		middle = match![1].trimEnd();
		trailing = match![2];
	} else {
		middle = line;
	}

	if (middle.length) {
		message.args = middle.split(/ +/);
	}

	if (typeof trailing !== 'undefined' && trailing.length) {
		message.args.push(trailing);
	}

	return message as ParsedMessage;
}
