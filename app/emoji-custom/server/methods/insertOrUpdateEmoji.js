import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';
import limax from 'limax';

import { hasPermission } from '../../../authorization';
import { EmojiCustom } from '../../../models/server/raw';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';
import { api } from '../../../../server/sdk/api';

Meteor.methods({
	async insertOrUpdateEmoji(emojiData) {
		if (!hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(emojiData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
				method: 'insertOrUpdateEmoji',
				field: 'Name',
			});
		}

		emojiData.name = limax(emojiData.name, { replacement: '_' });
		emojiData.aliases = limax(emojiData.aliases, { replacement: '_' });

		// allow all characters except colon, whitespace, comma, >, <, &, ", ', /, \, (, )
		// more practical than allowing specific sets of characters; also allows foreign languages
		const nameValidation = /[\s,:><&"'\/\\\(\)]/;
		const aliasValidation = /[:><&\|"'\/\\\(\)]/;

		// silently strip colon; this allows for uploading :emojiname: as emojiname
		emojiData.name = emojiData.name.replace(/:/g, '');
		emojiData.aliases = emojiData.aliases.replace(/:/g, '');

		if (nameValidation.test(emojiData.name)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.name} is not a valid name`, {
				method: 'insertOrUpdateEmoji',
				input: emojiData.name,
				field: 'Name',
			});
		}

		if (emojiData.aliases) {
			if (aliasValidation.test(emojiData.aliases)) {
				throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.aliases} is not a valid alias set`, {
					method: 'insertOrUpdateEmoji',
					input: emojiData.aliases,
					field: 'Alias_Set',
				});
			}
			emojiData.aliases = emojiData.aliases.split(/[\s,]/);
			emojiData.aliases = emojiData.aliases.filter(Boolean);
			emojiData.aliases = _.without(emojiData.aliases, emojiData.name);
		} else {
			emojiData.aliases = [];
		}

		emojiData.extension = emojiData.extension === 'svg+xml' ? 'png' : emojiData.extension;

		let matchingResults = [];

		if (emojiData._id) {
			matchingResults = await EmojiCustom.findByNameOrAliasExceptID(emojiData.name, emojiData._id).toArray();
			for await (const alias of emojiData.aliases) {
				matchingResults = matchingResults.concat(await EmojiCustom.findByNameOrAliasExceptID(alias, emojiData._id).toArray());
			}
		} else {
			matchingResults = await EmojiCustom.findByNameOrAlias(emojiData.name).toArray();
			for await (const alias of emojiData.aliases) {
				matchingResults = matchingResults.concat(await EmojiCustom.findByNameOrAlias(alias).toArray());
			}
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error(
				'Custom_Emoji_Error_Name_Or_Alias_Already_In_Use',
				'The custom emoji or one of its aliases is already in use',
				{ method: 'insertOrUpdateEmoji' },
			);
		}

		if (typeof emojiData.extension === 'undefined') {
			throw new Meteor.Error('error-the-field-is-required', 'The custom emoji file is required', {
				method: 'insertOrUpdateEmoji',
			});
		}

		if (!emojiData._id) {
			// insert emoji
			const createEmoji = {
				name: emojiData.name,
				aliases: emojiData.aliases,
				extension: emojiData.extension,
			};

			const _id = (await EmojiCustom.create(createEmoji)).insertedId;

			api.broadcast('emoji.updateCustom', createEmoji);

			return _id;
		}
		// update emoji
		if (emojiData.newFile) {
			RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
			RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`));
			RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.extension}`));
			RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`));

			await EmojiCustom.setExtension(emojiData._id, emojiData.extension);
		} else if (emojiData.name !== emojiData.previousName) {
			const rs = RocketChatFileEmojiCustomInstance.getFileWithReadStream(
				encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`),
			);
			if (rs !== null) {
				RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
				const ws = RocketChatFileEmojiCustomInstance.createWriteStream(
					encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`),
					rs.contentType,
				);
				ws.on(
					'end',
					Meteor.bindEnvironment(() =>
						RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`)),
					),
				);
				rs.readStream.pipe(ws);
			}
		}

		if (emojiData.name !== emojiData.previousName) {
			await EmojiCustom.setName(emojiData._id, emojiData.name);
		}

		if (emojiData.aliases) {
			await EmojiCustom.setAliases(emojiData._id, emojiData.aliases);
		} else {
			await EmojiCustom.setAliases(emojiData._id, []);
		}

		api.broadcast('emoji.updateCustom', emojiData);

		return true;
	},
});
