import type { IUser } from './IUser';

export type AbacPreviewMember = Pick<IUser, '_id' | 'username' | 'name'>;

export type AbacMembershipVerdict = 'compliant' | 'nonCompliant' | 'inconclusive';

export interface IAbacMembershipPreview {
	compliant: AbacPreviewMember[];
	nonCompliant: AbacPreviewMember[];
	inconclusive: AbacPreviewMember[];
	creator: AbacMembershipVerdict;
}
