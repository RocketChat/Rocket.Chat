import type { IMessage as AppsEngineMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IMessage } from '@rocket.chat/core-typings';

export async function convertMessageFiles(
	files: IMessage['files'],
	attachments: IMessage['attachments'],
): Promise<AppsEngineMessage['files']> {
	return files?.map((file) => {
		if (!file || file.typeGroup) {
			return file;
		}

		// Thumbnails from older messages did not have any identification but we can extrapolate this information from other data
		if (files.length === 2 && attachments?.length === 1 && file === files[1]) {
			return {
				...file,
				typeGroup: 'thumb',
			};
		}

		return file;
	});
}
