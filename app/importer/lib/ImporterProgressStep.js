/** The progress step that an importer is at. */
export const ProgressStep = Object.freeze({
	NEW: 'importer_new',
	UPLOADING: 'importer_uploading',
	DOWNLOADING_FILE: 'importer_downloading_file',
	FILE_LOADED: 'importer_file_loaded',

	PREPARING_STARTED: 'importer_preparing_started',
	PREPARING_USERS: 'importer_preparing_users',
	PREPARING_CHANNELS: 'importer_preparing_channels',
	PREPARING_MESSAGES: 'importer_preparing_messages',

	USER_SELECTION: 'importer_user_selection',

	IMPORTING_STARTED: 'importer_importing_started',
	IMPORTING_USERS: 'importer_importing_users',
	IMPORTING_CHANNELS: 'importer_importing_channels',
	IMPORTING_MESSAGES: 'importer_importing_messages',
	IMPORTING_FILES: 'importer_importing_files',
	FINISHING: 'importer_finishing',

	DONE: 'importer_done',
	ERROR: 'importer_import_failed',
	CANCELLED: 'importer_import_cancelled',
});

export const ImportWaitingStates = [ProgressStep.NEW, ProgressStep.UPLOADING, ProgressStep.DOWNLOADING_FILE];

export const ImportFileReadyStates = [ProgressStep.FILE_LOADED];

export const ImportPreparingStartedStates = [
	ProgressStep.PREPARING_STARTED,
	ProgressStep.PREPARING_USERS,
	ProgressStep.PREPARING_CHANNELS,
	ProgressStep.PREPARING_MESSAGES,
];

export const ImportingStartedStates = [
	ProgressStep.IMPORTING_STARTED,
	ProgressStep.IMPORTING_USERS,
	ProgressStep.IMPORTING_CHANNELS,
	ProgressStep.IMPORTING_MESSAGES,
	ProgressStep.IMPORTING_FILES,
	ProgressStep.FINISHING,
];

export const ImportingDoneStates = [ProgressStep.DONE, ProgressStep.ERROR, ProgressStep.CANCELLED];

export const ImportingErrorStates = [ProgressStep.ERROR, ProgressStep.CANCELLED];
