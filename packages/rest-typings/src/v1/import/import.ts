import type { IImport, IImportChannel, IImportUser } from '@rocket.chat/core-typings';

import type { DownloadPublicImportFileParamsPOST } from './DownloadPublicImportFileParamsPOST';
import type { StartImportParamsPOST } from './StartImportParamsPOST';
import type { UploadImportFileParamsPOST } from './UploadImportFileParamsPOST';

export type ImportEndpoints = {
	'/v1/uploadImportFile': {
		POST: (params: UploadImportFileParamsPOST) => void;
	};
	'/v1/downloadPublicImportFile': {
		POST: (params: DownloadPublicImportFileParamsPOST) => void;
	};
	'/v1/startImport': {
		POST: (params: StartImportParamsPOST) => void;
	};
	'/v1/getImportFileData': {
		GET: () => {
			users: Array<IImportUser>;
			channels: Array<IImportChannel>;
			message_count: number;
		};
	};
	'/v1/getImportProgress': {
		GET: () => {
			key: string;
			name: string;
			step: string;
			count: {
				completed: number;
				total: number;
			};
		};
	};
	'/v1/getLatestImportOperations': {
		GET: () => Array<IImport>;
	};
	'/v1/downloadPendingFiles': {
		POST: () => { count: number };
	};
	'/v1/downloadPendingAvatars': {
		POST: () => { count: number };
	};
	'/v1/getCurrentImportOperations': {
		GET: () => { operation: IImport };
	};
};
