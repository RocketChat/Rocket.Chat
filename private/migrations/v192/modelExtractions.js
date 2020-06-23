const crypto = require('crypto');

const moduleRequire = require('./moduleRequire');

const _ = moduleRequire('lodash');

//
//
// RoomEvents
//
//
const v1ToV2RootMap = ['clid', 'pids', 'v', 'ts', 'src', 'rid', 't', 'd', 'updatedAt', 'deletedAt'];

function fromV1Data(message) {
	return { ..._.omit(message, this.v1ToV2RootMap), t: message.t || 'msg', u: message.u, msg: message.msg };
}

//
//
// Events
//
//
const EventTypeDescriptor = {
	// // Global
	// PING = 'ping',

	// Rooms
	ROOM: 'room',
	DELETE_ROOM: 'droom',
	MESSAGE: 'msg',
	EDIT_MESSAGE: 'emsg',
	DELETE_MESSAGE: 'dmsg',

	// // Not implemented
	// ADD_USER = 'add_user',
	// REMOVE_USER = 'remove_user',
	// SET_MESSAGE_REACTION = 'set_message_reaction',
	// UNSET_MESSAGE_REACTION = 'unset_message_reaction',
	// MUTE_USER = 'mute_user',
	// UNMUTE_USER = 'unmute_user',
};

const dataHashOptionsDefinition = [
	{
		t: [EventTypeDescriptor.MESSAGE, EventTypeDescriptor.EDIT_MESSAGE],
		options: {
			include: ['t', 'u', 'msg'],
		},
	},
];

const dataHashOptions = dataHashOptionsDefinition.reduce((acc, item) => {
	for (const t of item.t) {
		acc[t] = item.options;
	}

	return acc;
}, {});

function SHA256(content) {
	return crypto.createHash('sha256').update(content).digest('hex');
}

function getEventIdHash(contextQuery, event) {
	return SHA256(`${ event.src }${ JSON.stringify(contextQuery) }${ event.pids.join(',') }${ event.t }${ event.ts }${ event.dHash }`);
}

function getEventDataHash(event) {
	let data = event.d;

	const options = dataHashOptions[event.t];

	if (options) {
		if (options.include) { data = _.pick(data, options.include); }
		if (options.skip) { data = _.omit(data, options.skip); }
	}

	return SHA256(JSON.stringify(data));
}

function buildEvent(src, rid, t, d, pids = [], addIsLeaf = false) {
	const contextQuery = { rid };

	const event = {
		pids,
		v: 2,
		ts: new Date(),
		src,
		...contextQuery,
		t,
		dHash: '',
		d,
	};

	//
	// Create the data hash
	event.dHash = getEventDataHash(event);

	if (addIsLeaf) {
		event.isLeaf = true;
	}

	event._id = getEventIdHash(contextQuery, event);

	return event;
}

//
// Export
//
module.exports = {
	RoomEvents: {
		v1ToV2RootMap,
		fromV1Data,
	},
	Events: {
		SHA256,
		getEventIdHash,
		getEventDataHash,
		buildEvent,
	},
};
