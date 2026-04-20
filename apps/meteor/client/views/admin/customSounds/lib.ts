import { CUSTOM_SOUND_ALLOWED_MIME_TYPES } from '../../../../lib/constants';

type ClientCustomSoundData = {
	_id?: string;
	name: string;
	previousSound?: {
		extension?: string;
	};
};

// Here previousData will define if it is an update or a new entry
export function validate(soundData: ClientCustomSoundData, soundFile?: File): ('Name' | 'Sound File' | 'FileType')[] {
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
	name: string,
	previousData?: {
		_id: string;
		previousSound?: { extension?: string };
	},
): ClientCustomSoundData => {
	const sanitizedName = name.trim();

	if (!previousData) {
		return {
			name: sanitizedName,
		};
	}

	return {
		_id: previousData._id,
		name: sanitizedName,
		previousSound: previousData.previousSound,
	};
};
