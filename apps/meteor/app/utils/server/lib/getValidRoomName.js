import { Meteor } from 'meteor/meteor';
import limax from 'limax';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Settings, Rooms } from '@rocket.chat/models';

import { validateName } from '../../../lib/server/functions/validateName';

// TODO: temporal while settings are made async
export const getValidRoomName = async (displayName, rid = '', options = {}) => {
	let slugifiedName = displayName;

	if ((await Settings.findOneById('UI_Allow_room_names_with_special_chars')).value) {
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
			nameValidation = new RegExp(`^${(await Settings.findOneById('UTF8_Channel_Names_Validation')).value}$`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}
	}

	if (!nameValidation.test(slugifiedName) || !(await validateName(slugifiedName))) {
		throw new Meteor.Error('error-invalid-room-name', `${escapeHTML(slugifiedName)} is not a valid room name.`, {
			function: 'RocketChat.getValidRoomName',
			channel_name: escapeHTML(slugifiedName),
		});
	}

	if (options.allowDuplicates !== true) {
		const room = await Rooms.findOneByName(slugifiedName);
		if (room && room._id !== rid) {
			if ((await Settings.findOneById('UI_Allow_room_names_with_special_chars')).value) {
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
