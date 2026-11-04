import { sdk } from '../SDKClient';

/** Stores a file picked in a view as a temporary upload of the room, which expires unless the view is submitted. */
export const uploadUiKitFile = (rid: string, file: File): Promise<{ _id: string; name: string }> =>
	new Promise((resolve, reject) => {
		const xhr = sdk.rest.upload(`/v1/rooms.media/${rid}`, { file }, { error: () => reject(new Error('upload-failed')) });

		xhr.onload = () => {
			if (xhr.status !== 200) {
				reject(new Error(xhr.responseText));
				return;
			}

			try {
				resolve({ _id: JSON.parse(xhr.responseText).file._id, name: file.name });
			} catch (error) {
				reject(error instanceof Error ? error : new Error('upload-failed'));
			}
		};
	});
