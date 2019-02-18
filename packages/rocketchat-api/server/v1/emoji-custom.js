import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from 'meteor/rocketchat:models';
import { API } from '../api';
import Busboy from 'busboy';

// DEPRECATED
// Will be removed after v1.12.0
API.v1.addRoute('emoji-custom', { authRequired: true }, {
	get() {
		const warningMessage = 'The endpoint "emoji-custom" is deprecated and will be removed after version v1.12.0';
		console.warn(warningMessage);
		const { query } = this.parseJsonQuery();
		const emojis = Meteor.call('listEmojiCustom', query);

		return API.v1.success(this.deprecationWarning({
			endpoint: 'emoji-custom',
			versionWillBeRemove: '1.12.0',
			response: {
				emojis,
			},
		}));
	},
});

API.v1.addRoute('emoji-custom.list', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const { updatedSince } = this.queryParams;
		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-roomId-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
		}

		let emojis = Meteor.runAsUser(this.userId, () => Meteor.call('listEmojiCustom', query, updatedSinceDate));

		if (Array.isArray(emojis)) {
			emojis = {
				update: emojis,
				remove: [],
			};
		}

		return API.v1.success({ emojis });
	},
});

API.v1.addRoute('emoji-custom.create', { authRequired: true }, {
	post() {
		Meteor.runAsUser(this.userId, () => {
			const fields = {};
			const busboy = new Busboy({ headers: this.request.headers });
			const emojiData = [];
			let emojiMimetype = '';

			Meteor.wrapAsync((callback) => {
				busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
					if (fieldname !== 'emoji') {
						return callback(new Meteor.Error('invalid-field'));
					}

					file.on('data', Meteor.bindEnvironment((data) => emojiData.push(data)));

					file.on('end', Meteor.bindEnvironment(() => {
						const extension = mimetype.split('/')[1];
						emojiMimetype = mimetype;
						fields.extension = extension;
					}));
				}));
				busboy.on('field', (fieldname, val) => {
					fields[fieldname] = val;
				});
				busboy.on('finish', Meteor.bindEnvironment(() => {
					fields.newFile = true;
					fields.aliases = fields.aliases || '';
					try {
						Meteor.call('insertOrUpdateEmoji', fields);
						Meteor.call('uploadEmojiCustom', Buffer.concat(emojiData), emojiMimetype, fields);
						callback();
					} catch (error) {
						return callback(error);
					}
				}));
				this.request.pipe(busboy);
			})();
		});
	},
});

API.v1.addRoute('emoji-custom.update', { authRequired: true }, {
	post() {
		Meteor.runAsUser(this.userId, () => {
			const fields = {};
			const busboy = new Busboy({ headers: this.request.headers });
			const emojiData = [];
			let emojiMimetype = '';

			Meteor.wrapAsync((callback) => {
				busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
					if (fieldname !== 'emoji') {
						return callback(new Meteor.Error('invalid-field'));
					}
					file.on('data', Meteor.bindEnvironment((data) => emojiData.push(data)));

					file.on('end', Meteor.bindEnvironment(() => {
						const extension = mimetype.split('/')[1];
						emojiMimetype = mimetype;
						fields.extension = extension;
					}));
				}));
				busboy.on('field', (fieldname, val) => {
					fields[fieldname] = val;
				});
				busboy.on('finish', Meteor.bindEnvironment(() => {
					try {
						if (!fields._id) {
							return callback(new Meteor.Error('The required "_id" query param is missing.'));
						}
						const emojiToUpdate = EmojiCustom.findOneByID(fields._id);
						if (!emojiToUpdate) {
							return callback(new Meteor.Error('Emoji not found.'));
						}
						fields.previousName = emojiToUpdate.name;
						fields.previousExtension = emojiToUpdate.extension;
						fields.aliases = fields.aliases || '';
						fields.newFile = Boolean(emojiData.length);
						Meteor.call('insertOrUpdateEmoji', fields);
						if (emojiData.length) {
							Meteor.call('uploadEmojiCustom', Buffer.concat(emojiData), emojiMimetype, fields);
						}
						callback();
					} catch (error) {
						return callback(error);
					}
				}));
				this.request.pipe(busboy);
			})();

		});
	},
});

API.v1.addRoute('emoji-custom.delete', { authRequired: true }, {
	post() {
		const { emojiId } = this.bodyParams;
		if (!emojiId) {
			return API.v1.failure('The "emojiId" params is required!');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('deleteEmojiCustom', emojiId));

		return API.v1.success();
	},
});
