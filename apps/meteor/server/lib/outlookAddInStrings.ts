/** What Outlook shows from the manifest, read when the add-in is installed. */
export const OUTLOOK_ADDIN_MANIFEST_STRINGS = {
	name: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Name', defaultValue: 'Rocket.Chat Meetings' },
	description: {
		settingId: 'Pexip_Integration_Outlook_AddIn_String_Description',
		defaultValue: 'Add Rocket.Chat meetings to your calendar events.',
	},
	group: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Group', defaultValue: 'Rocket.Chat' },
	button: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Button', defaultValue: 'Add Rocket.Chat Meeting' },
	buttonDescription: {
		settingId: 'Pexip_Integration_Outlook_AddIn_String_Button_Description',
		defaultValue: 'Add a Rocket.Chat meeting to this event.',
	},
} as const;

/** What the task pane shows, written into its script as it is served. */
export const OUTLOOK_ADDIN_PANE_STRINGS = {
	loading: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Loading', defaultValue: 'Checking what you can schedule…' },
	unreachable: {
		settingId: 'Pexip_Integration_Outlook_AddIn_String_Unreachable',
		defaultValue: 'Rocket.Chat could not be reached. Please try again later.',
	},
	intro: {
		settingId: 'Pexip_Integration_Outlook_AddIn_String_Intro',
		defaultValue: 'Add a Rocket.Chat meeting to this event. Its details are added to the end of the invitation.',
	},
	addSipAlias: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Add_SIP_Alias', defaultValue: 'Add a dial-in number' },
	confirm: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Confirm', defaultValue: 'Add meeting' },
	adding: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Adding', defaultValue: 'Adding the meeting…' },
	added: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Added', defaultValue: 'The meeting details were added to this event.' },
	error: { settingId: 'Pexip_Integration_Outlook_AddIn_String_Error', defaultValue: 'The meeting could not be added. Please try again.' },
	notAvailable: {
		settingId: 'Pexip_Integration_Outlook_AddIn_String_Not_Available',
		defaultValue: 'Your account cannot schedule Rocket.Chat meetings. Please contact your workspace administrator.',
	},
} as const;

export type OutlookAddInManifestStrings = Record<keyof typeof OUTLOOK_ADDIN_MANIFEST_STRINGS, string>;

export type OutlookAddInPaneStrings = Record<keyof typeof OUTLOOK_ADDIN_PANE_STRINGS, string>;
