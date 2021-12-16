import { ICreatedRoom } from '../../../../definition/IRoom';
import { IUser } from '../../../../definition/IUserAction';
import { ICreateRoomParams } from '../../../../server/sdk/types/IRoomService';

export const createRoom: (type: ICreateRoomParams['type'], name: ICreateRoomParams['name'], owner: IUser['username'], members?: ICreateRoomParams['members'], readOnly?: ICreateRoomParams['readOnly'], extraData?: ICreateRoomParams['extraData'], options?: ICreateRoomParams['options']) => ICreatedRoom | undefined;
