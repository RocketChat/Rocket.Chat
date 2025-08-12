import type { IImportProgress } from '@rocket.chat/core-typings';

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
	PREPARING_CONTACTS: 'importer_preparing_contacts',

	USER_SELECTION: 'importer_user_selection',

	IMPORTING_STARTED: 'importer_importing_started',
	IMPORTING_USERS: 'importer_importing_users',
	IMPORTING_CHANNELS: 'importer_importing_channels',
	IMPORTING_MESSAGES: 'importer_importing_messages',
	IMPORTING_CONTACTS: 'importer_importing_contacts',
	IMPORTING_FILES: 'importer_importing_files',
	FINISHING: 'importer_finishing',

	DONE: 'importer_done',
	ERROR: 'importer_import_failed',
	CANCELLED: 'importer_import_cancelled',
} satisfies Record<string, IImportProgress['step']>);

export const ImportWaitingStates: IImportProgress['step'][] = [ProgressStep.NEW, ProgressStep.UPLOADING, ProgressStep.DOWNLOADING_FILE];

export const ImportFileReadyStates: IImportProgress['step'][] = [ProgressStep.FILE_LOADED];

export const ImportPreparingStartedStates: IImportProgress['step'][] = [
	ProgressStep.PREPARING_STARTED,
	ProgressStep.PREPARING_USERS,
	ProgressStep.PREPARING_CHANNELS,
	ProgressStep.PREPARING_MESSAGES,
	ProgressStep.PREPARING_CONTACTS,
];

export const ImportingStartedStates: IImportProgress['step'][] = [
	ProgressStep.IMPORTING_STARTED,
	ProgressStep.IMPORTING_USERS,
	ProgressStep.IMPORTING_CHANNELS,
	ProgressStep.IMPORTING_MESSAGES,
	ProgressStep.IMPORTING_CONTACTS,
	ProgressStep.IMPORTING_FILES,
	ProgressStep.FINISHING,
];

export const ImportingErrorStates: IImportProgress['step'][] = [ProgressStep.ERROR, ProgressStep.CANCELLED];
