import { Rooms } from '@rocket.chat/models';
import { escapeHTML } from '@rocket.chat/string-helpers';
import limax from 'limax';
import { Meteor } from 'meteor/meteor';

import { validateName } from '../../../lib/server/functions/validateName';
import { settings } from '../../../settings/server';

export const getValidRoomName = async (
	displayName: string,
	rid = '',
	options: { allowDuplicates?: boolean; nameValidationRegex?: string } = {},
) => {
	let slugifiedName = displayName;

	if (settings.get('UI_Allow_room_names_with_special_chars')) {
		const cleanName = limax(displayName, { maintainCase: true });
		if (options.allowDuplicates !== true) {
			const room = await Rooms.findOneByDisplayName(displayName);
			if (room && room._id !== rid) {
				if (room.archived) {
					throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${cleanName}`, {
						function: 'RocketChat.getValidRoomName',
						channel_name: cleanName,
					});
				} else {
					throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${cleanName}' exists`, {
						function: 'RocketChat.getValidRoomName',
						channel_name: cleanName,
					});
				}
			}
		}
		slugifiedName = cleanName;
	}

	let nameValidation;

	if (options.nameValidationRegex) {
		nameValidation = new RegExp(options.nameValidationRegex);
	} else {
		try {
			const baseValidation = settings.get('UTF8_Channel_Names_Validation');
			// Allow spaces between words, but don't allow a string consisting only of spaces
			nameValidation = new RegExp(`^(?!\\s+$)${baseValidation}`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_. ]+$');
		}
	}
	if (!nameValidation.test(slugifiedName) || !validateName(slugifiedName)) {
		throw new Meteor.Error('error-invalid-room-name', `${escapeHTML(slugifiedName)} is not a valid room name.`, {
			function: 'RocketChat.getValidRoomName',
			channel_name: escapeHTML(slugifiedName),
		});
	}

	if (options.allowDuplicates !== true) {
		const room = await Rooms.findOneByName(slugifiedName);
		if (room && room._id !== rid) {
			if (settings.get('UI_Allow_room_names_with_special_chars')) {
				let tmpName = slugifiedName;
				let next = 0;
				// eslint-disable-next-line no-await-in-loop
				while (await Rooms.findOneByNameAndNotId(tmpName, rid)) {
					tmpName = `${slugifiedName}-${++next}`;
				}
				slugifiedName = tmpName;
			} else if (room.archived) {
				throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${escapeHTML(slugifiedName)}`, {
					function: 'RocketChat.getValidRoomName',
					channel_name: escapeHTML(slugifiedName),
				});
			} else {
				throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${escapeHTML(slugifiedName)}' exists`, {
					function: 'RocketChat.getValidRoomName',
					channel_name: escapeHTML(slugifiedName),
				});
			}
		}
	}

	return slugifiedName;
};
