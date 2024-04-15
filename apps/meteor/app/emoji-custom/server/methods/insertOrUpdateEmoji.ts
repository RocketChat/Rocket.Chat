import { api } from '@rocket.chat/core-services';
import { EmojiCustom } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import limax from 'limax';
import { Meteor } from 'meteor/meteor';

import { trim } from '../../../../lib/utils/stringUtils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		insertOrUpdateEmoji(emojiData: {
			_id?: string;
			name: string;
			aliases: string;
			extension: string;
			previousName?: string;
			previousExtension?: string;
			newFile?: boolean;
		}): string | boolean;
	}
}

Meteor.methods<ServerMethods>({
	async insertOrUpdateEmoji(emojiData) {
		if (!this.userId || !(await hasPermissionAsync(this.userId, 'manage-emoji'))) {
			throw new Meteor.Error('not_authorized');
		}

		if (!trim(emojiData.name)) {
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

		let aliases: string[] = [];
		if (emojiData.aliases) {
			if (aliasValidation.test(emojiData.aliases)) {
				throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.aliases} is not a valid alias set`, {
					method: 'insertOrUpdateEmoji',
					input: emojiData.aliases,
					field: 'Alias_Set',
				});
			}

			aliases = emojiData.aliases
				.split(/[\s,]/)
				.filter(Boolean)
				.filter((value) => !(emojiData.name === value));
		}

		emojiData.extension = emojiData.extension === 'svg+xml' ? 'png' : emojiData.extension;

		let matchingResults = [];

		if (emojiData._id) {
			matchingResults = await EmojiCustom.findByNameOrAliasExceptID(emojiData.name, emojiData._id).toArray();
			for await (const alias of aliases) {
				matchingResults = matchingResults.concat(await EmojiCustom.findByNameOrAliasExceptID(alias, emojiData._id).toArray());
			}
		} else {
			matchingResults = await EmojiCustom.findByNameOrAlias(emojiData.name).toArray();
			for await (const alias of aliases) {
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
				aliases,
				extension: emojiData.extension,
			};

			const _id = (await EmojiCustom.create(createEmoji)).insertedId;

			void api.broadcast('emoji.updateCustom', createEmoji);

			return _id;
		}
		// update emoji
		if (emojiData.newFile) {
			await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
			await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`));
			await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.extension}`));
			await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`));

			await EmojiCustom.setExtension(emojiData._id, emojiData.extension);
		} else if (emojiData.name !== emojiData.previousName) {
			const rs = await RocketChatFileEmojiCustomInstance.getFileWithReadStream(
				encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`),
			);
			if (rs !== null) {
				await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
				const ws = RocketChatFileEmojiCustomInstance.createWriteStream(
					encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`),
					rs.contentType,
				);
				ws.on('end', () =>
					RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`)),
				);
				rs.readStream.pipe(ws);
			}
		}

		if (emojiData.name !== emojiData.previousName) {
			await EmojiCustom.setName(emojiData._id, emojiData.name);
		}

		if (emojiData.aliases) {
			await EmojiCustom.setAliases(emojiData._id, aliases);
		} else {
			await EmojiCustom.setAliases(emojiData._id, []);
		}

		void api.broadcast('emoji.updateCustom', emojiData);

		return true;
	},
});
