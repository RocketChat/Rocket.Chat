type soundFileType = {
	name: string;
	type: string;
	extension?: string;
};

export type soundDataType = {
	extension: string;
	_id?: string;
	previousName?: string;
	previousSound?: {
		extension?: string;
	};
	previousExtension?: string;
	name?: string;
	newFile?: boolean;
	random?: number;
};

// Here previousData will define if it is an update or a new entry
export function validate(soundData: soundDataType, soundFile?: soundFileType): ('Name' | 'Sound File' | 'FileType')[] {
	const errors: ('Name' | 'Sound File' | 'FileType')[] = [];

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

export const createSoundData = function createSoundData(
	soundFile: soundFileType,
	name: string,
	previousData?: soundDataType,
): soundDataType {
	const soundData: soundDataType = {
		extension: soundFile?.name.split('.').pop() || '',
	};

	if (previousData) {
		soundData._id = previousData._id;
		soundData.previousName = previousData.previousName;
		soundData.previousSound = previousData.previousSound;
		soundData.previousExtension = previousData.previousSound?.extension;
		soundData.name = name;
		soundData.newFile = false;
	} else {
		soundData.name = name.trim();
		soundData.newFile = true;
	}

	return soundData;
};
