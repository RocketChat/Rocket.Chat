import { IRoom } from '../../../../../../definition/IRoom';

export type AddRoomsEndpoint = {
	POST: (params: { rooms: string[]; teamId: string }) => {
		success: true;
		statusCode: 200;
		body: IRoom[];
	};
};
