import { Avatars } from '@rocket.chat/models';

import { FileUpload } from '../../../../../file-upload/server';

export interface IAvatarMetadataFile {
	type: string;
	name: string;
}

export class RocketChatFileAdapter {
	public async getBufferForAvatarFile(username: string): Promise<any> {
		const file = (await Avatars.findOneByName(username)) as Record<string, any>;
		if (!file?._id) {
			return;
		}
		return FileUpload.getBufferSync(file);
	}

	public async getFileMetadataForAvatarFile(username: string): Promise<IAvatarMetadataFile> {
		const file = (await Avatars.findOneByName(username)) as Record<string, any>;

		return {
			type: file.type,
			name: file.name,
		};
	}
}
