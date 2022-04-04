import { Meteor } from 'meteor/meteor';

import { EmojiCustom } from '../../../models/server/raw';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';
import { findEmojisCustom } from '../lib/emoji-custom';
import { Media } from '../../../../server/sdk';

API.v1.addRoute(
	'emoji-custom.list',
	{ authRequired: true },
	{
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
				return API.v1.success({
					emojis: {
						update: Promise.await(EmojiCustom.find({ ...query, _updatedAt: { $gt: updatedSinceDate } }).toArray()),
						remove: Promise.await(EmojiCustom.trashFindDeletedAfter(updatedSinceDate).toArray()),
					},
				});
			}

			return API.v1.success({
				emojis: {
					update: Promise.await(EmojiCustom.find(query).toArray()),
					remove: [],
				},
			});
		},
	},
);

API.v1.addRoute(
	'emoji-custom.all',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();

			return API.v1.success(
				Promise.await(
					findEmojisCustom({
						query,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'emoji-custom.create',
	{ authRequired: true },
	{
		post() {
			const { emoji, ...fields } = Promise.await(
				getUploadFormData({
					request: this.request,
				}),
			);

			if (!emoji) {
				throw new Meteor.Error('invalid-field');
			}

			const isUploadable = Promise.await(Media.isImage(emoji.fileBuffer));
			if (!isUploadable) {
				throw new Meteor.Error('emoji-is-not-image', "Emoji file provided cannot be uploaded since it's not an image");
			}

			const [, extension] = emoji.mimetype.split('/');
			fields.extension = extension;

			fields.newFile = true;
			fields.aliases = fields.aliases || '';

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('insertOrUpdateEmoji', fields);
				Meteor.call('uploadEmojiCustom', emoji.fileBuffer, emoji.mimetype, fields);
			});
		},
	},
);

API.v1.addRoute(
	'emoji-custom.update',
	{ authRequired: true },
	{
		post() {
			const { emoji, ...fields } = Promise.await(
				getUploadFormData({
					request: this.request,
				}),
			);

			if (!fields._id) {
				throw new Meteor.Error('The required "_id" query param is missing.');
			}

			const emojiToUpdate = Promise.await(EmojiCustom.findOneById(fields._id));
			if (!emojiToUpdate) {
				throw new Meteor.Error('Emoji not found.');
			}

			fields.previousName = emojiToUpdate.name;
			fields.previousExtension = emojiToUpdate.extension;
			fields.aliases = fields.aliases || '';
			fields.newFile = Boolean(emoji?.fileBuffer.length);

			if (fields.newFile) {
				const isUploadable = Promise.await(Media.isImage(emoji.fileBuffer));
				if (!isUploadable) {
					throw new Meteor.Error('emoji-is-not-image', "Emoji file provided cannot be uploaded since it's not an image");
				}

				const [, extension] = emoji.mimetype.split('/');
				fields.extension = extension;
			} else {
				fields.extension = emojiToUpdate.extension;
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('insertOrUpdateEmoji', fields);
				if (fields.newFile) {
					Meteor.call('uploadEmojiCustom', emoji.fileBuffer, emoji.mimetype, fields);
				}
			});
		},
	},
);

API.v1.addRoute(
	'emoji-custom.delete',
	{ authRequired: true },
	{
		post() {
			const { emojiId } = this.bodyParams;
			if (!emojiId) {
				return API.v1.failure('The "emojiId" params is required!');
			}

			Meteor.runAsUser(this.userId, () => Meteor.call('deleteEmojiCustom', emojiId));

			return API.v1.success();
		},
	},
);
