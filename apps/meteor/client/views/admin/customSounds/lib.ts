import type { ICustomSoundData } from '../../../../app/custom-sounds/server/methods/insertOrUpdateSound';

type ICustomSoundFile = {
	name: string;
	type: string;
	extension?: string;
};

// Here previousData will define if it is an update or a new entry
export function validate(soundData: ICustomSoundData, soundFile?: ICustomSoundFile): ('Name' | 'Sound File' | 'FileType')[] {
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

export const createSoundData = (
	soundFile: ICustomSoundFile,
	name: string,
	previousData?: {
		_id: string;
		extension: string;
		previousName: string;
		previousSound: {
			extension?: string;
		};
	},
): ICustomSoundData => {
	if (!previousData) {
		return {
			name: name.trim(),
			extension: soundFile?.name.split('.').pop() || '',
			newFile: true,
		};
	}

	return {
		_id: previousData._id,
		name,
		extension: soundFile?.name.split('.').pop() || '',
		previousName: previousData.previousName,
		previousExtension: previousData.previousSound?.extension,
		previousSound: previousData.previousSound,
		newFile: false,
	};
};
