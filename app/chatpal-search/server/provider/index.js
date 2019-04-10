import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import ChatpalLogger from '../utils/logger';
import { Random } from 'meteor/random';
import { Rooms, Messages, Uploads } from '../../../models';
import { FileUpload } from '../../../file-upload';
const getFileBuffer = Meteor.wrapAsync(FileUpload.getBuffer, FileUpload);

/**
 * Enables HTTP functions on Chatpal Backend
 */
class Backend {

	constructor(options) {
		this._options = options;
	}

	/**
	 * index a set of Sorl documents
	 * @param docs
	 * @returns {boolean}
	 */
	index(docs) {
		const options = {
			data:docs,
			params:{ language:this._options.language },
			...this._options.httpOptions,
		};

		try {

			const response = HTTP.call('POST', `${ this._options.baseurl }${ this._options.updatepath }`, options);

			if (response.statusCode >= 200 && response.statusCode < 300) {
				ChatpalLogger.debug(`indexed ${ docs.length } documents`, JSON.stringify(response.data, null, 2));
			} else {
				throw new Error(response);
			}

		} catch (e) {
			// TODO how to deal with this
			ChatpalLogger.error('indexing failed', JSON.stringify(e, null, 2));
			return false;
		}

	}

	/**
	 * index a single file
	 * @param docs
	 * @returns {boolean}
	 */
	indexFile(fileObj) {
		const options = Object.assign({
			params: { language:this._options.language },
			...this._options.httpOptions,
		}, fileObj);

		const logObj = Object.assign({}, options);
		delete logObj.content;
		ChatpalLogger.debug('file index options:', JSON.stringify(logObj, null, 2));

		try {

			const response = HTTP.call('POST', `${ this._options.baseurl }${ this._options.fileupdatepath }`, options);

			if (response.statusCode >= 200 && response.statusCode < 300) {
				ChatpalLogger.debug('indexed file', JSON.stringify(response.data, null, 2));
			} else {
				throw new Error(response);
			}

		} catch (e) {
			// TODO how to deal with this
			ChatpalLogger.error('file indexing failed', JSON.stringify(e, null, 2));
			return false;
		}

	}

	/**
	 * remove an entry by type and id
	 * @param type
	 * @param id
	 * @returns {boolean}
	 */
	remove(type, id) {
		ChatpalLogger.debug(`Remove ${ type }(${ id }) from Index`);

		const options = {
			data:{
				delete: {
					query: `id:${ id } AND type:${ type }`,
				},
				commit:{},
			},
			...this._options.httpOptions,
		};

		try {
			const response = HTTP.call('POST', this._options.baseurl + this._options.clearpath, options);

			return response.statusCode >= 200 && response.statusCode < 300;
		} catch (e) {
			return false;
		}
	}

	count(type) {
		return this.query({ type, rows:0, text:'*' })[type].numFound;
	}

	/**
	 * query with params
	 * @param params
	 * @param callback
	 */
	query(params, callback) {

		const options = {
			params,
			...this._options.httpOptions,
		};

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

	suggest(params, callback) {

		const options = {
			params,
			...this._options.httpOptions,
		};

		HTTP.call('POST', this._options.baseurl + this._options.suggestionpath, options, (err, result) => {
			if (err) { return callback(err); }

			try {
				callback(undefined, result.data.suggestion);
			} catch (e) {
				callback(e);
			}
		});
	}

	clear() {
		ChatpalLogger.debug('Clear Index');

		const options = {
			data:{
				delete: {
					query: '*:*',
				},
				commit:{},
			}, ...this._options.httpOptions,
		};

		try {
			const response = HTTP.call('POST', this._options.baseurl + this._options.clearpath, options);

			return response.statusCode >= 200 && response.statusCode < 300;
		} catch (e) {
			return false;
		}
	}

	/**
	 * statically ping with configuration
	 * @param options
	 * @returns {boolean}
	 */
	static ping(config) {

		const options = {
			params: {
				stats:true,
			},
			...config.httpOptions,
		};

		try {
			const response = HTTP.call('GET', config.baseurl + config.pingpath, options);

			if (response.statusCode >= 200 && response.statusCode < 300) {
				return response.data.stats;
			} else {
				return false;
			}
		} catch (e) {
			return false;
		}
	}

}

/**
 * Enabled batch indexing
 */
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
		this._func(this._values, this._rest);// TODO if flush does not work
		this._values = [];
	}
}

/**
 * Provides index functions to chatpal provider
 */
export default class Index {

	/**
	 * Creates Index Stub
	 * @param options
	 * @param clear if a complete reindex should be done
	 */
	constructor(options, clear, date) {

		this._id = Random.id();

		this._backend = new Backend(options);

		this._options = options;

		this._batchIndexer = new BatchIndexer(this._options.batchSize || 100, (values) => this._backend.index(values));

		this._bootstrap(clear, date);
	}

	/**
	 * prepare solr documents
	 * @param type
	 * @param doc
	 * @returns {*}
	 * @private
	 */
	_getIndexDocument(type, doc) {
		switch (type) {
			case 'message':
				return {
					id: doc._id,
					rid: doc.rid,
					user: doc.u._id,
					created: doc.ts,
					updated: doc._updatedAt,
					text: doc.msg,
					type,
				};
			case 'room':
				return {
					id: doc._id,
					rid: doc._id,
					created: doc.createdAt,
					updated: doc.lm ? doc.lm : doc._updatedAt,
					type,
					room_name: doc.name,
					room_announcement: doc.announcement,
					room_description: doc.description,
					room_topic: doc.topic,
				};
			case 'user':
				return {
					id: doc._id,
					created: doc.createdAt,
					updated: doc._updatedAt,
					type,
					user_username: doc.username,
					user_name: doc.name,
					user_email: doc.emails && doc.emails.map((e) => e.address),
				};
			case 'file':
				return {
					id: doc._id,
					rid: doc.rid,
					mid: doc.mid,
					user: doc.userId,
					uploaded: doc.uploadedAt,
					updated: doc._updatedAt,
					type,
					file_name: doc.name,
					file_desc: doc.description,
					file_type: doc.type,
					file_size: doc.size,
					file_store: doc.store,
					file_link: doc.link,
				};
			default: throw new Error(`Cannot index type '${ type }'`);
		}
	}

	/**
	 * return true if there are messages in the databases which has been created before *date*
	 * @param date
	 * @returns {boolean}
	 * @private
	 */
	_existsDataOlderThan(date) {
		return Messages.model.find({ ts:{ $lt: new Date(date) }, t:{ $exists:false } }, { limit:1 }).fetch().length > 0;
	}

	_doesRoomCountDiffer() {
		return Rooms.find({ t:{ $ne:'d' } }).count() !== this._backend.count('room');
	}

	_doesUserCountDiffer() {
		return Meteor.users.find({ active:true }).count() !== this._backend.count('user');
	}

	/**
	 * Index users by using a database cursor
	 */
	_indexUsers() {
		const cursor = Meteor.users.find({ active:true });

		ChatpalLogger.debug(`Start indexing ${ cursor.count() } users`);

		cursor.forEach((user) => {
			this.indexDoc('user', user, false);
		});

		ChatpalLogger.info(`Users indexed successfully (index-id: ${ this._id })`);
	}

	/**
	 * Index rooms by database cursor
	 * @private
	 */
	_indexRooms() {
		const cursor = Rooms.find({ t:{ $ne:'d' } });

		ChatpalLogger.debug(`Start indexing ${ cursor.count() } rooms`);

		cursor.forEach((room) => {
			this.indexDoc('room', room, false);
		});

		ChatpalLogger.info(`Rooms indexed successfully (index-id: ${ this._id })`);
	}

	_indexMessages(date, gap) {

		const start = new Date(date - gap);
		const end = new Date(date);

		const cursor = Messages.model.find({ ts:{ $gt: start, $lt: end }, t:{ $exists:false } });

		ChatpalLogger.debug(`Start indexing ${ cursor.count() } messages between ${ start.toString() } and ${ end.toString() }`);

		cursor.forEach((message) => {
			this.indexDoc('message', message, false);
		});

		ChatpalLogger.info(`Messages between ${ start.toString() } and ${ end.toString() } indexed successfully (index-id: ${ this._id })`);

		return start.getTime();
	}

	_run(date, resolve, reject) {

		this._running = true;

		if (this._existsDataOlderThan(date) && !this._break) {

			Meteor.setTimeout(() => {
				date = this._indexMessages(date, (this._options.windowSize || 24) * 3600000);

				this._run(date, resolve, reject);

			}, this._options.timeout || 1000);
		} else if (this._break) {
			ChatpalLogger.info(`stopped bootstrap (index-id: ${ this._id })`);

			this._batchIndexer.flush();

			this._running = false;

			resolve();
		} else {

			ChatpalLogger.info(`No messages older than already indexed date ${ new Date(date).toString() }`);

			if (this._doesUserCountDiffer() && !this._break) {
				this._indexUsers();
			} else {
				ChatpalLogger.info('Users already indexed');
			}

			if (this._doesRoomCountDiffer() && !this._break) {
				this._indexRooms();
			} else {
				ChatpalLogger.info('Rooms already indexed');
			}

			this._batchIndexer.flush();

			ChatpalLogger.info(`finished bootstrap (index-id: ${ this._id })`);

			this._running = false;

			resolve();
		}
	}

	_bootstrap(clear, date) {

		ChatpalLogger.info('Start bootstrapping');

		return new Promise((resolve, reject) => {

			if (clear) {
				this._backend.clear();
				date = new Date().getTime();
			}

			this._run(date, resolve, reject);

		});
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
		// Detect messages with file attachment
		if (type === 'message' && doc.file && doc.file._id) {
			const file = Uploads.findOneById(doc.file._id);
			if (file) {
				const maxFileSize = 20 * Math.pow(1024, 2);

				file.mid = doc._id;
				const attachment = doc.attachments.filter((a) => a.type === 'file')[0];
				if (attachment) {
					file.link = attachment.title_link;
					// Attachment description can be edited, so we overwrite the original description
					file.description = attachment.description;
				}

				ChatpalLogger.debug('Indexing file:', file);

				try {
					let data = '';
					if (file.size >= maxFileSize) {
						ChatpalLogger.warn(`File size exceeds maximum allowed size (${ maxFileSize }), skipping file content indexing.`);
					} else {
						data = getFileBuffer(file);
					}

					const fileIndexOptions = {
						content: data,
						params: {
							'resource.name': file.name,
							'literal.id': file._id,
							'literal.rid': file.rid,
							'literal.mid': file.mid,
							'literal.user': file.userId,
							'literal.uploaded': file.uploadedAt,
							'literal.updated': file._updatedAt,
							'literal.file_name': file.name,
							'literal.file_desc': file.description,
							'literal.file_type': file.type,
							'literal.file_size': file.size,
							'literal.file_store': file.store,
							'literal.file_link': file.link,
						},
						headers: {
							'Content-Type': file.type,
						},
					};
					this._backend.indexFile(fileIndexOptions);
				} catch (err) {
					ChatpalLogger.error('Error while retrieving file content:', err);
				}
			}

			// Skip message indexing
			return true;
		}

		this._batchIndexer.add(this._getIndexDocument(type, doc));

		if (flush) { this._batchIndexer.flush(); }

		return true;
	}

	removeDoc(type, id, doc) {
		if (type === 'message' && doc && doc.file && doc.file._id) {
			return this._backend.remove('file', doc.file._id);
		}
		return this._backend.remove(type, id);
	}

	query(text, language, acl, type, start, rows, callback, params = {}) {
		this._backend.query({
			text,
			language,
			acl,
			type,
			start,
			rows,
			...params,
		}, callback);
	}

	suggest(text, language, acl, type, callback) {
		this._backend.suggest({
			text,
			language,
			acl,
			type,
		}, callback);
	}

}
