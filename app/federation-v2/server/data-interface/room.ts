import { IRoom } from '../../../../definition/IRoom';
import { Rooms } from '../../../models/server';

export const normalize = async (roomId: string): Promise<IRoom> => {
	// Normalize the user
	return Rooms.findOneById(roomId);
};
