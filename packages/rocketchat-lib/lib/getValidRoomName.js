import s from 'underscore.string';

RocketChat.getValidRoomName = function getValidRoomName(displayName, rid = '') {
	let slugifiedName = s.slugify(displayName);

	if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
		const room = RocketChat.models.Rooms.findOneByDisplayName(displayName);
		if (room && room._id !== rid) {
			if (room.archived) {
				throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${ displayName }`, { function: 'RocketChat.getValidRoomName', channel_name: displayName });
			} else {
				throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${ displayName }' exists`, { function: 'RocketChat.getValidRoomName', channel_name: displayName });
			}
		}
	}

	let nameValidation;
	try {
		nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(slugifiedName)) {
		throw new Meteor.Error('error-invalid-room-name', `${ slugifiedName } is not a valid room name.`, {
			'function': 'RocketChat.getValidRoomName',
			channel_name: slugifiedName
		});
	}

	const room = RocketChat.models.Rooms.findOneByName(slugifiedName);
	if (room && room._id !== rid) {
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			let tmpName = slugifiedName;
			let next = 0;
			while (RocketChat.models.Rooms.findOneByNameAndNotId(tmpName, rid)) {
				tmpName = `${ slugifiedName }-${ ++next }`;
			}
			slugifiedName = tmpName;
		} else if (room.archived) {
			throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${ slugifiedName }`, { function: 'RocketChat.getValidRoomName', channel_name: slugifiedName });
		} else {
			throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${ slugifiedName }' exists`, { function: 'RocketChat.getValidRoomName', channel_name: slugifiedName });
		}
	}

	return slugifiedName;
};
