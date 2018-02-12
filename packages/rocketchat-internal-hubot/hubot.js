/* globals __meteor_bootstrap__ */
import _ from 'underscore';
import s from 'underscore.string';

import 'coffeescript/register';

const Hubot = Npm.require('hubot');

// Start a hubot, connected to our chat room.
// 'use strict'
// Log messages?
const DEBUG = false;

let InternalHubot = {};

const sendHelper = Meteor.bindEnvironment((robot, envelope, strings, map) =>{
	while (strings.length > 0) {
		const string = strings.shift();
		if (typeof(string) === 'function') {
			string();
		} else {
			try {
				map(string);
			} catch (err) {
				if (DEBUG) { console.error(`Hubot error: ${ err }`); }
				robot.logger.error(`RocketChat send error: ${ err }`);
			}
		}
	}
});

// Monkey-patch Hubot to support private messages
Hubot.Response.prototype.priv = (...strings) => this.robot.adapter.priv(this.envelope, ...strings);

// More monkey-patching
Hubot.Robot.prototype.loadAdapter = () => {}; // disable

// grrrr, Meteor.bindEnvironment doesn't preserve `this` apparently
const bind = function(f) {
	const g = Meteor.bindEnvironment((self, ...args) => f.apply(self, args));
	return function(...args) { return g(this, ...Array.from(args)); };
};

class Robot extends Hubot.Robot {
	constructor(...args) {
		super(...(args || []));
		this.hear = bind(this.hear);
		this.respond = bind(this.respond);
		this.enter = bind(this.enter);
		this.leave = bind(this.leave);
		this.topic = bind(this.topic);
		this.error = bind(this.error);
		this.catchAll = bind(this.catchAll);
		this.user = Meteor.users.findOne({username: this.name}, {fields: {username: 1}});
	}
	loadAdapter() { return false; }
	hear(regex, callback) { return super.hear(regex, Meteor.bindEnvironment(callback)); }
	respond(regex, callback) { return super.respond(regex, Meteor.bindEnvironment(callback)); }
	enter(callback) { return super.enter(Meteor.bindEnvironment(callback)); }
	leave(callback) { return super.leave(Meteor.bindEnvironment(callback)); }
	topic(callback) { return super.topic(Meteor.bindEnvironment(callback)); }
	error(callback) { return super.error(Meteor.bindEnvironment(callback)); }
	catchAll(callback) { return super.catchAll(Meteor.bindEnvironment(callback)); }
}

class RocketChatAdapter extends Hubot.Adapter {
	// Public: Raw method for sending data back to the chat source. Extend this.
	//
	// envelope - A Object with message, room and user details.
	// strings  - One or more Strings for each message to send.
	//
	// Returns nothing.
	send(envelope, ...strings) {
		if (DEBUG) { console.log('ROCKETCHATADAPTER -> send'.blue); }
		// console.log envelope, strings
		return sendHelper(this.robot, envelope, strings, string => {
			if (DEBUG) { console.log(`send ${ envelope.room }: ${ string } (${ envelope.user.id })`); }
			return RocketChat.sendMessage(InternalHubot.user, { msg: string }, { _id: envelope.room });
		});
	}

	// Public: Raw method for sending emote data back to the chat source.
	//
	// envelope - A Object with message, room and user details.
	// strings  - One or more Strings for each message to send.
	//
	// Returns nothing.
	emote(envelope, ...strings) {
		if (DEBUG) { console.log('ROCKETCHATADAPTER -> emote'.blue); }
		return sendHelper(this.robot, envelope, strings, string => {
			if (DEBUG) { console.log(`emote ${ envelope.rid }: ${ string } (${ envelope.u.username })`); }
			if (envelope.message.private) { return this.priv(envelope, `*** ${ string } ***`); }
			return Meteor.call('sendMessage', {
				msg: string,
				rid: envelope.rid,
				action: true
			}
			);
		});
	}

	// Priv: our extension -- send a PM to user
	priv(envelope, ...strings) {
		if (DEBUG) { console.log('ROCKETCHATADAPTER -> priv'.blue); }
		return sendHelper(this.robot, envelope, strings, function(string) {
			if (DEBUG) { console.log(`priv ${ envelope.room }: ${ string } (${ envelope.user.id })`); }
			return Meteor.call('sendMessage', {
				u: {
					username: RocketChat.settings.get('InternalHubot_Username')
				},
				to: `${ envelope.user.id }`,
				msg: string,
				rid: envelope.room
			});
		});
	}

	// Public: Raw method for building a reply and sending it back to the chat
	// source. Extend this.
	//
	// envelope - A Object with message, room and user details.
	// strings  - One or more Strings for each reply to send.
	//
	// Returns nothing.
	reply(envelope, ...strings) {
		if (DEBUG) { console.log('ROCKETCHATADAPTER -> reply'.blue); }
		if (envelope.message.private) {
			return this.priv(envelope, ...strings);
		} else {
			return this.send(envelope, ...strings.map(str => `${ envelope.user.name }: ${ str }`));
		}
	}

	// Public: Raw method for setting a topic on the chat source. Extend this.
	//
	// envelope - A Object with message, room and user details.
	// strings  - One more more Strings to set as the topic.
	//
	// Returns nothing.
	topic(/*envelope, ...strings*/) {
		if (DEBUG) { return console.log('ROCKETCHATADAPTER -> topic'.blue); }
	}

	// Public: Raw method for playing a sound in the chat source. Extend this.
	//
	// envelope - A Object with message, room and user details.
	// strings  - One or more strings for each play message to send.
	//
	// Returns nothing
	play(/*envelope, ...strings*/) {
		if (DEBUG) { return console.log('ROCKETCHATADAPTER -> play'.blue); }
	}

	// Public: Raw method for invoking the bot to run. Extend this.
	//
	// Returns nothing.
	run() {
		if (DEBUG) { console.log('ROCKETCHATADAPTER -> run'.blue); }
		this.robot.emit('connected');
		return this.robot.brain.mergeData({});
	}
	// @robot.brain.emit 'loaded'

	// Public: Raw method for shutting the bot down. Extend this.
	//
	// Returns nothing.
	close() {
		if (DEBUG) { return console.log('ROCKETCHATADAPTER -> close'.blue); }
	}
}

const InternalHubotReceiver = (message) => {
	if (DEBUG) { console.log(message); }
	if (message.u.username !== InternalHubot.name) {
		const room = RocketChat.models.Rooms.findOneById(message.rid);

		if (room.t === 'c') {
			const InternalHubotUser = new Hubot.User(message.u.username, {room: message.rid});
			const InternalHubotTextMessage = new Hubot.TextMessage(InternalHubotUser, message.msg, message._id);
			InternalHubot.adapter.receive(InternalHubotTextMessage);
		}
	}
	return message;
};

class HubotScripts {
	constructor(robot) {
		const modulesToLoad = [
			'hubot-help/src/help.coffee'
		];
		const customPath = RocketChat.settings.get('InternalHubot_PathToLoadCustomScripts');
		HubotScripts.load(`${ __meteor_bootstrap__.serverDir }/npm/node_modules/meteor/rocketchat_internal-hubot/node_modules/`, modulesToLoad, robot);
		HubotScripts.load(customPath, RocketChat.settings.get('InternalHubot_ScriptsToLoad').split(',') || [], robot);
	}

	static load(path, scriptsToLoad, robot) {
		if (!path || !scriptsToLoad) {
			return;
		}
		scriptsToLoad.forEach(scriptFile => {
			try {
				scriptFile = s.trim(scriptFile);
				if (scriptFile === '') {
					return;
				}
				// delete require.cache[require.resolve(path+scriptFile)];
				const fn = Npm.require(path + scriptFile);
				if (typeof(fn) === 'function') {
					fn(robot);
				} else {
					fn.default(robot);
				}
				robot.parseHelp(path + scriptFile);
				console.log(`Loaded ${ scriptFile }`.green);
			} catch (e) {
				console.log(`Can't load ${ scriptFile }`.red);
				console.log(e);
			}
		});
	}
}

const init = _.debounce(Meteor.bindEnvironment(() => {
	if (RocketChat.settings.get('InternalHubot_Enabled')) {
		InternalHubot = new Robot(null, null, false, RocketChat.settings.get('InternalHubot_Username'));
		InternalHubot.alias = 'bot';
		InternalHubot.adapter = new RocketChatAdapter(InternalHubot);
		new HubotScripts(InternalHubot);
		InternalHubot.run();
		return RocketChat.callbacks.add('afterSaveMessage', InternalHubotReceiver, RocketChat.callbacks.priority.LOW, 'InternalHubot');
	} else {
		InternalHubot = {};
		return RocketChat.callbacks.remove('afterSaveMessage', 'InternalHubot');
	}
}), 1000);

Meteor.startup(function() {
	init();
	RocketChat.models.Settings.findByIds([ 'InternalHubot_Username', 'InternalHubot_Enabled', 'InternalHubot_ScriptsToLoad', 'InternalHubot_PathToLoadCustomScripts']).observe({
		changed() {
			return init();
		}
	});
	// TODO useful when we have the ability to invalidate `require` cache
	// RocketChat.RateLimiter.limitMethod('reloadInternalHubot', 1, 5000, {
	// 	userId(/*userId*/) { return true; }
	// });
	// Meteor.methods({
	// 	reloadInternalHubot: () => init()
	// });
});
