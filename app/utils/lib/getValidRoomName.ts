import { Meteor } from 'meteor/meteor';
import limax from 'limax';

import { settings } from '../../settings/server';
import { Rooms } from '../../models/server';

export const getValidRoomName = (displayName: string, rid: string|undefined, options: { allowDuplicates?: boolean; nameValidationRegex?: string|RegExp}): string => {
	let slugifiedName = displayName;

	if (settings.get('UI_Allow_room_names_with_special_chars')) {
		if (options.allowDuplicates !== true) {
			const room = Rooms.findOneByDisplayName(displayName);
			if (room && room._id !== rid) {
				if (room.archived) {
					throw new Error(`There's an archived channel with name ${ displayName }`);
				} else {
					throw new Error(`A channel with name '${ displayName }' exists`);
				}
			}
		}
		slugifiedName = limax(displayName);
	}

	let nameValidation;

	if (options.nameValidationRegex) {
		nameValidation = new RegExp(options.nameValidationRegex);
	} else {
		try {
			nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}
	}

	if (!nameValidation.test(slugifiedName)) {
		throw new Meteor.Error('error-invalid-room-name', `${ slugifiedName } is not a valid room name.`, {
			function: 'RocketChat.getValidRoomName',
			// eslint-disable-next-line @typescript-eslint/camelcase
			channel_name: slugifiedName,
		});
	}

	if (options.allowDuplicates !== true) {
		const room = Rooms.findOneByName(slugifiedName);
		if (room && room._id !== rid) {
			if (settings.get('UI_Allow_room_names_with_special_chars')) {
				let tmpName = slugifiedName;
				let next = 0;
				while (Rooms.findOneByNameAndNotId(tmpName, rid)) {
					tmpName = `${ slugifiedName }-${ ++next }`;
				}
				slugifiedName = tmpName;
			} else if (room.archived) {
				throw new Error(`There's an archived channel with name ${ slugifiedName }`);
			} else {
				throw new Error(`A channel with name '${ slugifiedName }' exists`);
			}
		}
	}

	return slugifiedName;
};
