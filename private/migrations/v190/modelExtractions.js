const crypto = require('crypto');

const moduleRequire = require('./moduleRequire');

const _ = moduleRequire('lodash');

//
//
// RoomEvents
//
//
const v1ToV2RootMap = ['_cid', '_pids', 'v', 'ts', 'src', 'rid', 't', 'd', '_updatedAt', '_deletedAt'];

function fromV1Data(message) {
	return { ..._.omit(message, this.v1ToV2RootMap), t: message.t || 'msg', u: message.u, msg: message.msg, _msgSha: '' };
}

//
//
// Events
//
//
const hashOptions = {
	msg: {
		skip: ['msg'],
	},
	emsg: {
		skip: ['msg'],
	},
};

function SHA256(content) {
	return crypto.createHash('sha256').update(content).digest('hex');
}

function createEventId(contextQuery, event) {
	let data = event.d;

	const options = hashOptions[event.t];

	if (options) {
		data = _.omit(data, options.skip);
	}

	return SHA256(`${ event.src }${ JSON.stringify(contextQuery) }${ event._pids.join(',') }${ event.t }${ event.ts }${ JSON.stringify(data) }`);
}

function buildEvent(src, rid, t, d, _pids = [], addIsLeaf = false) {
	const contextQuery = { rid };

	const event = {
		_pids,
		v: 2,
		ts: new Date(),
		src,
		...contextQuery,
		t,
		d,
	};

	if (addIsLeaf) {
		event.isLeaf = true;
	}

	event._id = createEventId(contextQuery, event);

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
		createEventId,
		buildEvent,
	},
};
