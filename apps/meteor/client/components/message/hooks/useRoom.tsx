import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

export const useRoom = ({ _id }: Pick<IRoom, '_id'>): IRoom | null => Rooms.findOneById(_id) as unknown as IRoom;
