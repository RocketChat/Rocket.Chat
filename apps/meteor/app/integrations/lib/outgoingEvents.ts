import type { OutgoingIntegrationEvent } from '@rocket.chat/core-typings';

export const outgoingEvents: Record<
	OutgoingIntegrationEvent,
	{ label: string; value: OutgoingIntegrationEvent; use: { channel: boolean; triggerWords: boolean; targetRoom: boolean } }
> = {
	sendMessage: {
		label: 'Integrations_Outgoing_Type_SendMessage',
		value: 'sendMessage',
		use: {
			channel: true,
			triggerWords: true,
			targetRoom: false,
		},
	},
	fileUploaded: {
		label: 'Integrations_Outgoing_Type_FileUploaded',
		value: 'fileUploaded',
		use: {
			channel: true,
			triggerWords: false,
			targetRoom: false,
		},
	},
	roomArchived: {
		label: 'Integrations_Outgoing_Type_RoomArchived',
		value: 'roomArchived',
		use: {
			channel: false,
			triggerWords: false,
			targetRoom: false,
		},
	},
	roomCreated: {
		label: 'Integrations_Outgoing_Type_RoomCreated',
		value: 'roomCreated',
		use: {
			channel: false,
			triggerWords: false,
			targetRoom: false,
		},
	},
	roomJoined: {
		label: 'Integrations_Outgoing_Type_RoomJoined',
		value: 'roomJoined',
		use: {
			channel: true,
			triggerWords: false,
			targetRoom: false,
		},
	},
	roomLeft: {
		label: 'Integrations_Outgoing_Type_RoomLeft',
		value: 'roomLeft',
		use: {
			channel: true,
			triggerWords: false,
			targetRoom: false,
		},
	},
	userCreated: {
		label: 'Integrations_Outgoing_Type_UserCreated',
		value: 'userCreated',
		use: {
			channel: false,
			triggerWords: false,
			targetRoom: true,
		},
	},
} as const;
