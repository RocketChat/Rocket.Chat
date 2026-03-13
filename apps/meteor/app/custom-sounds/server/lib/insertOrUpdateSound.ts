import { api } from '@rocket.chat/core-services';
import { CustomSounds } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import type { ICustomSoundData } from '../methods/insertOrUpdateSound';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const insertOrUpdateSound = async (soundData: ICustomSoundData): Promise<string> => {
	if (!soundData.name?.trim()) {
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

	let matchingResults;

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
		return (
			await CustomSounds.create({
				name: soundData.name,
				extension: soundData.extension,
			})
		).insertedId;
	}

	// update sound
	if (soundData.newFile) {
		await RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.previousExtension}`);
	}

	if (soundData.name !== soundData.previousName) {
		await CustomSounds.setName(soundData._id, soundData.name);
		void api.broadcast('notify.updateCustomSound', {
			soundData: {
				_id: soundData._id,
				name: soundData.name,
				extension: soundData.extension,
			},
		});
	}

	return soundData._id;
};
