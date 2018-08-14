/** The progress step that an importer is at. */
export const ProgressStep = Object.freeze({
	NEW: 'importer_new',
	PREPARING_STARTED: 'importer_preparing_started',
	PREPARING_USERS: 'importer_preparing_users',
	PREPARING_CHANNELS: 'importer_preparing_channels',
	PREPARING_MESSAGES: 'importer_preparing_messages',
	USER_SELECTION: 'importer_user_selection',
	IMPORTING_STARTED: 'importer_importing_started',
	IMPORTING_USERS: 'importer_importing_users',
	IMPORTING_CHANNELS: 'importer_importing_channels',
	IMPORTING_MESSAGES: 'importer_importing_messages',
	FINISHING: 'importer_finishing',
	DONE: 'importer_done',
	ERROR: 'importer_import_failed',
	CANCELLED: 'importer_import_cancelled'
});
