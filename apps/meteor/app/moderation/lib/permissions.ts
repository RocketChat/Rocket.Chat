import type { IPermission } from '@rocket.chat/core-typings';

export const novicePermissions: IPermission['_id'][] = [
	'view-joined-room',
	'preview-c-room',
	'leave-c',
	'join-without-join-code',
	'view-joined-room',
	'view-history',
];

// permissions over novice set
export const explorerPermissions: IPermission['_id'][] = [
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

// each successive role adds to the previous one, order matters
export enum TrustRoles {
	NOVICE = 'novice',
	EXPLORER = 'explorer',
}
