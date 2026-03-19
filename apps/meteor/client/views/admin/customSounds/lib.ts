import type { ICustomSoundData } from '../../../../app/custom-sounds/server/methods/insertOrUpdateSound';
import { CUSTOM_SOUND_ALLOWED_MIME_TYPES } from '../../../../lib/constants';

const getExtension = (file?: File): string => {
	if (!file?.name) {
		return '';
	}

	const dotIndex = file.name.lastIndexOf('.');

	if (dotIndex <= 0 || dotIndex === file.name.length - 1) {
		return '';
	}

	return file.name.slice(dotIndex + 1).toLowerCase();
};

// Here previousData will define if it is an update or a new entry
export function validate(soundData: ICustomSoundData, soundFile?: File): ('Name' | 'Sound File' | 'FileType')[] {
	const errors: ('Name' | 'Sound File' | 'FileType')[] = [];

	if (!soundData.name) {
		errors.push('Name');
	}

	if (!soundData._id && !soundFile) {
		errors.push('Sound File');
	}

	if (soundFile) {
		if (!soundData.previousSound || soundData.previousSound !== soundFile) {
			if (!CUSTOM_SOUND_ALLOWED_MIME_TYPES.includes(soundFile.type)) {
				errors.push('FileType');
			}
		}
	}

	return errors;
}

export const createSoundData = (
	soundFile: File | undefined,
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
			extension: getExtension(soundFile),
		};
	}

	return {
		_id: previousData._id,
		name: name.trim(),
		extension: getExtension(soundFile),
		previousName: previousData.previousName,
		previousExtension: previousData.previousSound?.extension,
		previousSound: previousData.previousSound,
	};
};
