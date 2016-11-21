/* globals Importer */

Importer.HipChatEnterprise = class ImporterHipChatEnterprise extends Importer.Base {
	constructor(name, descriptionI18N, fileTypeRegex) {
		super(name, descriptionI18N, fileTypeRegex);
		this.logger.debug('Constructed a new HipChat Enterprise Importer.');

		this.Readable = require('stream').Readable;
		this.zlib = require('zlib');
		this.tarStream = Npm.require('tar-stream');
		this.extract = this.tarStream.extract();
		this.path = require('path');
		// this.messages = new Map();
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName);

		const tempUsers = [];
		const tempRooms = [];
		const tempMessages = new Map();
		const promise = new Promise((resolve, reject) => {
			this.extract.on('entry', (header, stream, next) => {
				if (header.name.indexOf('.json') !== -1) {
					const info = this.path.parse(header.name);

					stream.on('data', (chunk) => {
						const file = JSON.parse(chunk);

						if (info.base === 'users.json') {
							for (let u of file) {
								tempUsers.push({
									id: u.User.id,
									email: u.User.email,
									name: u.User.name,
									username: u.User.mention_name,
									avatar: u.User.avatar,
									timezone: u.User.timezone,
									isDeleted: u.User.is_deleted
								});
							}
						} else if (info.base === 'rooms.json') {
							for (let r of file) {
								tempRooms.push({
									id: r.Room.id,
									creator: r.Room.owner,
									created: new Date(r.Room.created),
									name: r.Room.name.replace(/ /g, '_').toLowerCase(),
									isPrivate: r.Room.privacy === 'private',
									isArchived: r.Room.is_archived,
									topic: r.Room.topic
								});
							}
							console.log(tempRooms);
						} else if (info.base === 'history.json') {
							const dirSplit = info.dir.split('/'); //['.', 'users', '1']
							if (dirSplit[1] === 'users') {
								//handling private messages
							} else if (dirSplit[1] === 'rooms') {
								const roomIdenifer = `${dirSplit[1]}/${dirSplit[2]}`;
								const roomMsgs = [];

								for (let m of file) {
									if (m.UserMessage) {
										roomMsgs.push({
											type: 'user',
											id: `hipchatenterprise-${dirSplit[2]}-${m.UserMessage.id}`,
											userId: m.UserMessage.sender.id,
											text: m.UserMessage.message.indexOf('/me ') === -1 ? m.UserMessage.message : `${m.UserMessage.message.replace(/\/me /, '_')}_`,
											ts: new Date(m.UserMessage.timestamp.split(' ')[0])
										});
									} else if (m.TopicRoomMessage) {
										roomMsgs.push({
											type: 'topic',
											id: `hipchatenterprise-${dirSplit[2]}-${m.TopicRoomMessage.id}`,
											userId: m.TopicRoomMessage.sender.id,
											ts: new Date(m.TopicRoomMessage.timestamp.split(' ')[0])
										});
									} else {
										console.warn('HipChat Enterprise importer isn\'t configured to handle this message:', m);
									}
								}
								console.log(roomMsgs);
								tempMessages.set(roomIdenifer, roomMsgs);
							} else {
								console.warn(`HipChat Enterprise importer isn't configured to handle "${dirSplit[1]}" files.`);
							}
						} else {
							//What are these files!?
							console.log(`HipChat Enterprise importer doesn't know what to do with the file "${header.name}" :o`, info);
						}
					});

					stream.on('end', () => next());
					stream.on('error', () => next());
				} else {
					next();
				}
			});

			this.extract.on('error', (err) => {
				console.warn('extract error:', err);
				reject();
			});

			this.extract.on('finish', () => {
				const selectionUsers = tempUsers.map((u) => new Importer.SelectionUser(u.id, u.username, u.email, u.isDeleted, false, true));
				const selectionChannels = tempRooms.map((r) => new Importer.SelectionChannel(r.id, r.name, r.isArchived, true, r.isPrivate));

				// super.updateProgress(Importer.ProgressStep.USER_SELECTION);

				resolve(new Importer.Selection(this.name, selectionUsers, selectionChannels));
			});

			//Wish I could make this cleaner :(
			const split = dataURI.split(',');
			const s = new this.Readable;
			s.push(new Buffer(split[split.length - 1], 'base64'));
			s.push(null);
			s.pipe(this.zlib.createGunzip()).pipe(this.extract);
		});

		return promise;
	}

	startImport(importSelection) {
		super.startImport(importSelection);
		// const started = Date.now();

		//Went it's done:
		// super.updateProgress(Importer.ProgressStep.FINISHING);
		// super.updateProgress(Importer.ProgressStep.DONE);
		// const timeTook = Date.now() - started;
		// this.logger.log(`CSV Import took ${timeTook} milliseconds.`);

		return super.getProgress();
	}

	getSelection() {
		// const selectionUsers = this.users.users.map((u) => new Importer.SelectionUser(u.id, u.username, u.email, false, false, true));
		// const selectionChannels = this.channels.channels.map((c) => new Importer.SelectionChannel(c.id, c.name, false, true, c.isPrivate));

		return new Importer.Selection(this.name, [], []);
	}
};
