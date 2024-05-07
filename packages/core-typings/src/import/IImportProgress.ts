export type ProgressStep =
	| 'importer_new'
	| 'importer_uploading'
	| 'importer_downloading_file'
	| 'importer_file_loaded'
	| 'importer_preparing_started'
	| 'importer_preparing_users'
	| 'importer_preparing_channels'
	| 'importer_preparing_messages'
	| 'importer_user_selection'
	| 'importer_importing_started'
	| 'importer_importing_users'
	| 'importer_importing_channels'
	| 'importer_importing_messages'
	| 'importer_importing_files'
	| 'importer_finishing'
	| 'importer_done'
	| 'importer_import_failed'
	| 'importer_import_cancelled';

export interface IImportProgress {
	key: string;
	name: string;
	step: ProgressStep;
	count: {
		completed: number;
		total: number;
	};
}
