import _ from 'underscore';
import ChatpalLogger from '../utils/logger';

const Future = Npm.require('fibers/future');

class Backend {

	constructor(options) {
		this._options = options;
	}

	index(docs) {
		const options = {data:docs};

		_.extend(options, this._options.httpOptions);

		try {

			const response = HTTP.call('POST', `${ this._options.baseurl }${ this._options.updatepath }`, options);

			if (response.statusCode >= 200 && response.statusCode < 300) {
				ChatpalLogger.debug(`indexed ${ docs.length } documents`, JSON.stringify(response.data, null, 2));
			} else {
				throw new Error(response);
			}

		} catch (e) {
			//TODO how to deal with this
			ChatpalLogger.error('indexing failed', JSON.stringify(e, null, 2));
			return false;
		}

	}

	remove(id) {
		ChatpalLogger.debug(`Remove ${ id } from Index`);

		const options = {data:{
			delete: {
				query: `id:${ id }`
			},
			commit:{}
		}};

		_.extend(options, this._options.httpOptions);

		try {
			const response = HTTP.call('POST', this._options.baseurl + this._options.clearpath, options);

			return response.statusCode >= 200 && response.statusCode < 300;
		} catch (e) {
			return false;
		}
	}

	query(params, callback) {

		const options = {params};

		_.extend(options, this._options.httpOptions);

		ChatpalLogger.debug('query: ', JSON.stringify(options, null, 2));

		try {
			if (callback) {
				HTTP.call('POST', this._options.baseurl + this._options.searchpath, options, (err, result) => {
					if (err) { return callback(err); }

					callback(undefined, result.data);
				});
			} else {

				const response = HTTP.call('POST', this._options.baseurl + this._options.searchpath, options);

				if (response.statusCode >= 200 && response.statusCode < 300) {
					return response.data;
				} else {
					throw new Error(response);
				}
			}
		} catch (e) {
			ChatpalLogger.error('query failed', JSON.stringify(e, null, 2));
			throw e;
		}
	}

	clear() {
		ChatpalLogger.debug('Clear Index');

		const options = {data:{
			delete: {
				query: '*:*'
			},
			commit:{}
		}};

		_.extend(options, this._options.httpOptions);

		try {
			const response = HTTP.call('POST', this._options.baseurl + this._options.clearpath, options);

			return response.statusCode >= 200 && response.statusCode < 300;
		} catch (e) {
			return false;
		}
	}

	static ping(options) {
		try {
			const response = HTTP.call('GET', options.baseurl + options.pingpath, options.httpOptions);

			return response.statusCode >= 200 && response.statusCode < 300;
		} catch (e) {
			return false;
		}
	}

}

class BatchIndexer {

	constructor(size, func, ...rest) {
		this._size = size;
		this._func = func;
		this._rest = rest;
		this._values = [];
	}

	add(value) {
		this._values.push(value);
		if (this._values.length === this._size) {
			this.flush();
		}
	}

	flush() {
		this._func(this._values, this._rest);//TODO if flush does not work
		this._values = [];
	}
}

export default class Index {

	constructor(options, clear) {

		this._backend = new Backend(options);

		this._options = options;

		this._batchIndexer = new BatchIndexer(this._options.batchSize || 100, (values) => this._backend.index(values));

		this._bootstrap(clear);
	}

	_getIndexDocument(type, doc) {
		switch (type) {
			case 'message':
				const idoc = {
					id: `m_${ doc._id }`,
					room: doc.rid,
					user: doc.u._id,
					created: doc.ts,
					updated: doc._updatedAt,
					type
				};
				idoc[`text_${ this._options.language }`] = doc.msg;
				return idoc;
			case 'room':
				return {
					id: `r_${ doc._id }`,
					room: doc._id,
					created: doc.createdAt,
					updated: doc.lm ? doc.lm : doc._updatedAt,
					type,
					room_name: doc.name,
					room_announcement: doc.announcement,
					room_description: doc.description,
					room_topic: doc.topic
				};
			case 'user':
				return {
					id: `u_${ doc._id }`,
					created: doc.createdAt,
					updated: doc._updatedAt,
					type,
					user_username: doc.username,
					user_name: doc.name,
					user_email: _.map(doc.emails, (e) => { return e.address; })
				};
			default: throw new Error(`Cannot index type '${ type }'`);
		}
	}

	_existsDataOlderThan(date) {
		return RocketChat.models.Messages.model.find({ts:{$lt: new Date(date)}, t:{$exists:false}}, {limit:1}).fetch().length > 0;
	}

	_indexUsers() {
		const cursor = Meteor.users.find({active:true});

		ChatpalLogger.debug(`Start indexing ${ cursor.count() } users`);

		cursor.forEach((user) => {
			this.indexDoc('user', user, false);
		});

		ChatpalLogger.info('Users indexed successfully');
	}

	_indexRooms() {
		const cursor = RocketChat.models.Rooms.find({t:{$ne:'d'}});

		ChatpalLogger.debug(`Start indexing ${ cursor.count() } rooms`);

		cursor.forEach((room) => {
			this.indexDoc('room', room, false);
		});

		ChatpalLogger.info('Rooms indexed successfully');
	}

	_indexMessages(date, gap) {

		const start = new Date(date - gap);
		const end = new Date(date);

		const cursor = RocketChat.models.Messages.model.find({ts:{$gt: start, $lt: end}, t:{$exists:false}});

		ChatpalLogger.debug(`Start indexing ${ cursor.count() } messages between ${ start.toString() } and ${ end.toString() }`);

		cursor.forEach((message) => {
			this.indexDoc('message', message, false);
		});

		ChatpalLogger.info(`Messages between ${ start.toString() } and ${ end.toString() } indexed successfully`);

		return start.getTime();
	}

	_getlastdate() {

		try {

			const result = this._backend.query({
				q:'*:*',
				rows:1,
				sort:'created asc',
				type: 'CHATPAL_RESULT_TYPE_MESSAGE'
			});

			if (result.response.numFound > 0) {
				return new Date(result.response.docs[0].created).valueOf();
			} else {
				return new Date().valueOf();
			}
		} catch (e) {
			ChatpalLogger.warn('cannot get latest date - complete reindex is triggered');
			return new Date().valueOf();
		}
	}

	_run(date, fut) {

		this._running = true;

		if (this._existsDataOlderThan(date) && !this._break) {

			Meteor.setTimeout(() => {
				date = this._indexMessages(date, (this._options.gap || 24) * 3600000);

				this._run(date, fut);

			}, this._options.timeout || 1000);
		} else if (this._break) {
			ChatpalLogger.info('stopped bootstrap');

			this._batchIndexer.flush();

			this._running = false;

			fut.return();
		} else {

			this._indexUsers();

			this._indexRooms();

			this._batchIndexer.flush();

			ChatpalLogger.info('finished bootstrap');

			this._running = false;

			fut.return();
		}
	}

	_bootstrap(clear) {

		ChatpalLogger.info('Start bootstrapping');

		const fut = new Future();

		let date = new Date().getTime();

		if (clear) {
			this._backend.clear();
		} else {
			date = this._getlastdate();
		}

		this._run(date, fut);

		return fut;
	}

	static ping(options) {
		return Backend.ping(options);
	}

	stop() {
		this._break = true;
	}

	reindex() {
		if (!this._running) {
			this._bootstrap(true);
		}
	}

	indexDoc(type, doc, flush = true) {
		this._batchIndexer.add(this._getIndexDocument(type, doc));

		if (flush) { this._batchIndexer.flush(); }

		return true;
	}

	removeDoc(type, id) {
		return this._backend.remove(`${ type[0] }_${ id }`);
	}

	query(text, language, acl, type, start, rows, callback, params = {}) {
		this._backend.query(_.extend(params, {
			text,
			language,
			acl,
			type,
			start,
			rows
		}), callback);
	}

}
