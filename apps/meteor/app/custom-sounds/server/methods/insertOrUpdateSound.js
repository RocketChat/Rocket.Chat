import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { CustomSounds } from '../../../models/server/raw';
import { api } from '../../../../server/sdk/api';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

Meteor.methods({
	async insertOrUpdateSound(soundData) {
		if (!hasPermission(this.userId, 'manage-sounds')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(soundData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
				method: 'insertOrUpdateSound',
				field: 'Name',
			});
		}

		// let nameValidation = new RegExp('^[0-9a-zA-Z-_+;.]+$');

		// allow all characters except colon, whitespace, comma, >, <, &, ", ', /, \, (, )
		// more practical than allowing specific sets of characters; also allows foreign languages
		const nameValidation = /[\s,:><&"'\/\\\(\)]/;

		// silently strip colon; this allows for uploading :soundname: as soundname
		soundData.name = soundData.name.replace(/:/g, '');

		if (nameValidation.test(soundData.name)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${soundData.name} is not a valid name`, {
				method: 'insertOrUpdateSound',
				input: soundData.name,
				field: 'Name',
			});
		}

		let matchingResults = [];

		if (soundData._id) {
			check(soundData._id, String);
			matchingResults = await CustomSounds.findByNameExceptId(soundData.name, soundData._id).toArray();
		} else {
			matchingResults = await CustomSounds.findByName(soundData.name).toArray();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('Custom_Sound_Error_Name_Already_In_Use', 'The custom sound name is already in use', {
				method: 'insertOrUpdateSound',
			});
		}

		if (!soundData._id) {
			// insert sound
			const createSound = {
				name: soundData.name,
				extension: soundData.extension,
			};

			const _id = await (await CustomSounds.create(createSound)).insertedId;
			createSound._id = _id;

			return _id;
		}
		// update sound
		if (soundData.newFile) {
			RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.previousExtension}`);
		}

		if (soundData.name !== soundData.previousName) {
			await CustomSounds.setName(soundData._id, soundData.name);
			api.broadcast('notify.updateCustomSound', { soundData });
		}

		return soundData._id;
	},
});
