/**
 * The add-in's page, piece by piece, each one a setting a workspace may rewrite. Served under the add-in's path by
 * the file name it is keyed by; a setting left empty falls back to the default shipped in `private/`.
 */
export const OUTLOOK_ADDIN_PAGE_FILES = {
	'taskpane.html': {
		settingId: 'Pexip_Integration_Outlook_AddIn_HTML',
		defaultAsset: 'outlook-addin/defaults/taskpane.html',
		contentType: 'text/html',
		code: 'text/html',
	},
	'taskpane.css': {
		settingId: 'Pexip_Integration_Outlook_AddIn_CSS',
		defaultAsset: 'outlook-addin/defaults/taskpane.css',
		contentType: 'text/css',
		code: 'css',
	},
	'behavior.js': {
		settingId: 'Pexip_Integration_Outlook_AddIn_Behavior_Script',
		defaultAsset: 'outlook-addin/defaults/behavior.js',
		contentType: 'application/javascript',
		code: 'javascript',
	},
} as const;
