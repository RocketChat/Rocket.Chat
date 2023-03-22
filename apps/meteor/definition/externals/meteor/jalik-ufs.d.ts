declare module 'meteor/jalik:ufs' {
	import type { IUpload } from '@rocket.chat/core-typings';

	namespace UploadFS {
		function getStore(name: 'AmazonS3:Uploads'): Store;

		interface Store {
			getRedirectURL(file: IUpload, forceDownload?: true, callback?: (err: Error | null, fileUrl: string) => void): void;
		}
	}
}
