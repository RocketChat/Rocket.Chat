import { IRoom } from '../../../../../../definition/IRoom';

export type AddRoomsEndpoint = {
	POST: (params: { rooms: IRoom['_id'][]; teamId: string }) => {
		success: true;
		statusCode: 200;
		body: IRoom[];
	};
};
