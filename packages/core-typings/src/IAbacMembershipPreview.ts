import type { IUser } from './IUser';

export type AbacPreviewMember = Pick<IUser, '_id' | 'username' | 'name'>;

export type AbacPreviewCursor = Pick<IUser, '_id' | 'username'>;

export type AbacMembershipVerdict = 'compliant' | 'nonCompliant' | 'inconclusive';

export interface IAbacMembershipPreview {
	compliant: AbacPreviewMember[];
	nonCompliant: AbacPreviewMember[];
	inconclusive: AbacPreviewMember[];
	creator: AbacMembershipVerdict;
}

export type AbacMembershipGroup = 'loses' | 'retains';

export type AbacRoomPreviewMember = AbacPreviewMember & { verdict: AbacMembershipVerdict; roles?: string[] };

export interface IAbacRoomMembershipPreview {
	members: AbacRoomPreviewMember[];
	count: number;
	checked: number;
	total?: number;
	next?: AbacPreviewCursor;
	editor?: AbacMembershipVerdict;
}
