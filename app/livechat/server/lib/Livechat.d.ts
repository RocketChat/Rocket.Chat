import { ILivechatVisitor, ILivechatVisitorDTO } from '../../../../definition/ILivechatVisitor';
import { IRoom } from '../../../../definition/IRoom';
import { IUser } from '../../../../definition/IUser';

export const Livechat: {
	registerGuest: (guest: ILivechatVisitorDTO) => ILivechatVisitor['_id'];
	removeGuest: (_id: string) => boolean;
	saveRoomInfo: (roomData: IRoom, guestData: ILivechatVisitor, userId?: IUser['_id']) => boolean;
	updateCallStatus: (callId: string, rid: IRoom['_id'], status: string, user: ILivechatVisitor) => void;
	notifyGuestStatusChanged: (token: ILivechatVisitor['token'], status: string) => void;
};
