// Here previousData will define if it is an update or a new entry
export function validate(soundData, soundFile) {
	const errors = [];

	if (!soundData.name) {
		errors.push('Name');
	}

	if (!soundData._id && !soundFile) {
		errors.push('Sound File');
	}

	if (soundFile) {
		if (!soundData.previousSound || soundData.previousSound !== soundFile) {
			if (!/audio\/mp3/.test(soundFile.type) && !/audio\/mpeg/.test(soundFile.type) && !/audio\/x-mpeg/.test(soundFile.type)) {
				errors.push('FileType');
			}
		}
	}

	return errors;
}

export function createSoundData(soundFile, name = '', previousData) {
	const soundData = {
		extension: soundFile.name.split('.').pop(),
	};

	if (previousData) {
		soundData._id = previousData._id;
		soundData.previousName = previousData.previousName;
		soundData.previousSound = previousData.previousSound;
		soundData.previousExtension = previousData.previousSound.extension;
		soundData.name = name;
		soundData.newFile = false;
	} else {
		soundData.name = name.trim();
		soundData.newFile = true;
	}

	return soundData;
}
