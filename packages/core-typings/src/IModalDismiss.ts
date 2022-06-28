import type { IModal } from './IModal';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IModalDismiss {
	_modal: IModal['_id'];
	_user: IUser['_id'];
	createdAt: Date;
}
