import { Media } from '@rocket.chat/core-services';
import type { IEmojiCustom } from '@rocket.chat/core-typings';
import { EmojiCustom } from '@rocket.chat/models';
import { isEmojiCustomList } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../../../server/lib/logger/system';
import type { EmojiData } from '../../../emoji-custom/server/lib/insertOrUpdateEmoji';
import { insertOrUpdateEmoji } from '../../../emoji-custom/server/lib/insertOrUpdateEmoji';
import { uploadEmojiCustomWithBuffer } from '../../../emoji-custom/server/lib/uploadEmojiCustom';
import { deleteEmojiCustom } from '../../../emoji-custom/server/methods/deleteEmojiCustom';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findEmojisCustom } from '../lib/emoji-custom';
import { getUploadFormData } from '../lib/getUploadFormData';

function validateDateParam(paramName: string, paramValue: string | undefined): Date | undefined {
	if (!paramValue) {
		return undefined;
	}

	const date = new Date(paramValue);
	if (isNaN(date.getTime())) {
		throw new Meteor.Error('error-roomId-param-invalid', `The "${paramName}" query parameter must be a valid date.`);
	}

	return date;
}

API.v1.addRoute(
	'emoji-custom.list',
	{ authRequired: true, validateParams: isEmojiCustomList },
	{
		async get() {
			const { query } = await this.parseJsonQuery();
			const { updatedSince, _updatedAt, _id } = this.queryParams;

			const updatedSinceDate = validateDateParam('updatedSince', updatedSince);
			const _updatedAtDate = validateDateParam('_updatedAt', _updatedAt);

			if (updatedSinceDate) {
				const [update, remove] = await Promise.all([
					EmojiCustom.find({
						...query,
						...(_id ? { _id } : {}),
						...(_updatedAtDate ? { _updatedAt: { $gt: _updatedAtDate } } : {}),
						_updatedAt: { $gt: updatedSinceDate },
					}).toArray(),
					EmojiCustom.trashFindDeletedAfter(updatedSinceDate).toArray(),
				]);

				return API.v1.success({
					emojis: {
						update,
						remove,
					},
				});
			}

			return API.v1.success({
				emojis: {
					update: await EmojiCustom.find({
						...query,
						...(_id ? { _id } : {}),
						...(_updatedAtDate ? { _updatedAt: { $gt: _updatedAtDate } } : {}),
					}).toArray(),
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
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await this.parseJsonQuery();

			return API.v1.success(
				await findEmojisCustom({
					query,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'emoji-custom.create',
	{ authRequired: true },
	{
		async post() {
			const emoji = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'emoji', sizeLimit: settings.get('FileUpload_MaxFileSize') },
			);

			const { fields, fileBuffer, mimetype } = emoji;

			const isUploadable = await Media.isImage(fileBuffer);
			if (!isUploadable) {
				throw new Meteor.Error('emoji-is-not-image', "Emoji file provided cannot be uploaded since it's not an image");
			}

			const [, extension] = mimetype.split('/');
			fields.extension = extension;

			try {
				const emojiData = await insertOrUpdateEmoji(this.userId, {
					...fields,
					newFile: true,
					aliases: fields.aliases || '',
					name: fields.name,
					extension: fields.extension,
				});

				await uploadEmojiCustomWithBuffer(this.userId, fileBuffer, mimetype, emojiData);
			} catch (e) {
				SystemLogger.error(e);
				return API.v1.failure();
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'emoji-custom.update',
	{ authRequired: true },
	{
		async post() {
			const emoji = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'emoji', sizeLimit: settings.get('FileUpload_MaxFileSize'), fileOptional: true },
			);

			const { fields, fileBuffer, mimetype } = emoji;

			if (!fields._id) {
				throw new Meteor.Error('The required "_id" query param is missing.');
			}

			const emojiToUpdate = await EmojiCustom.findOneById<Pick<IEmojiCustom, 'name' | 'extension'>>(fields._id, {
				projection: { name: 1, extension: 1 },
			});
			if (!emojiToUpdate) {
				throw new Meteor.Error('Emoji not found.');
			}

			const emojiData: EmojiData = {
				previousName: emojiToUpdate.name,
				previousExtension: emojiToUpdate.extension,
				aliases: fields.aliases || '',
				name: fields.name,
				extension: fields.extension,
				_id: fields._id,
				newFile: false,
			};

			const isNewFile = fileBuffer?.length && !!mimetype;
			if (isNewFile) {
				emojiData.newFile = isNewFile;
				const isUploadable = await Media.isImage(fileBuffer);
				if (!isUploadable) {
					throw new Meteor.Error('emoji-is-not-image', "Emoji file provided cannot be uploaded since it's not an image");
				}

				const [, extension] = mimetype.split('/');
				emojiData.extension = extension;
			} else {
				emojiData.extension = emojiToUpdate.extension;
			}

			const updatedEmojiData = await insertOrUpdateEmoji(this.userId, emojiData);
			if (isNewFile) {
				await uploadEmojiCustomWithBuffer(this.userId, fileBuffer, mimetype, updatedEmojiData);
			}
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'emoji-custom.delete',
	{ authRequired: true },
	{
		async post() {
			const { emojiId } = this.bodyParams;
			if (!emojiId) {
				return API.v1.failure('The "emojiId" params is required!');
			}

			await deleteEmojiCustom(this.userId, emojiId);

			return API.v1.success();
		},
	},
);
