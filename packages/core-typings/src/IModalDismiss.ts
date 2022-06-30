import type { IModal } from './IModal';
import type { IUser } from './IUser';

export interface IModalDismiss {
	modalId: IModal['_id'];
	userId: IUser['_id'];
	createdAt: Date;
}
