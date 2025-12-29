import type { IPermission } from '@rocket.chat/core-typings';

// This list is currently duplicated on the client code as there's no available API to load it from the server
export const guestPermissions: IPermission['_id'][] = [
	'view-d-room',
	'view-joined-room',
	'view-p-room',
	'start-discussion',
	'mobile-upload-file',
];
