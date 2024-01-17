import type { IImport, IImporterSelection, IImportProgress, IImporterInfo, ImportStatus, IImportUser } from '@rocket.chat/core-typings';

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
		GET: () => IImporterSelection | { waiting: true };
	};
	'/v1/getImportProgress': {
		GET: () => IImportProgress;
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
	'/v1/getCurrentImportOperation': {
		GET: () => { operation: IImport };
	};
	'/v1/importers.list': {
		GET: () => Array<IImporterInfo>;
	};
	'/v1/import.clear': {
		POST: () => void;
	};
	'/v1/import.new': {
		POST: () => { operation: IImport };
	};
	'/v1/import.status': {
		GET: () => ImportStatus;
	};
	'/v1/import.addUsers': {
		POST: (users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[]) => void;
	};
	'/v1/import.run': {
		POST: () => void;
	};
};
