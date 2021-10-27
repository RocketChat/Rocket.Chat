import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

export type RoomsEndpoints = {
	'rooms.autocomplete.channelAndPrivate': {
		GET: (params: { selector: string }) => {
			items: IRoom[];
		};
	};
	'rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: { selector: string; offset?: number; count?: number; sort?: string }) => {
			items: IRoom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'rooms.autocomplete.availableForTeams': {
		GET: (params: { name: string }) => {
			items: IRoom[];
		};
	};
	'rooms.info': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			room: IRoom;
		};
	};
	'rooms.createDiscussion': {
		POST: (params: {
			prid: IRoom['_id'];
			pmid?: IMessage['_id'];
			t_name: IRoom['fname'];
			users?: IUser['username'][];
			encrypted?: boolean;
			reply?: string;
		}) => {
			discussion: IRoom;
		};
	};
};
