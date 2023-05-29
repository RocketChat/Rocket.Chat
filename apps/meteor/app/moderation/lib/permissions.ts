import type { IPermission } from '@rocket.chat/core-typings';

export const novice: IPermission['_id'][] = [
	'view-joined-room',
	'preview-c-room',
	'leave-c',
	'join-without-join-code',
	'view-joined-room',
	'view-history',
];

export const explorer: IPermission['_id'][] = [
	...novice,
	'view-d-room',
	'view-c-room',
	'mention-all',
	'mention-here',
	'view-p-room',
	'leave-p',
	'view-outside-room',
	'delete-own-message',
	'edit-own-message',
];
