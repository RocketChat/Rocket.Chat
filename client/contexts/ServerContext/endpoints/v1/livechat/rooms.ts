import { IOmnichannelRoom } from '../../../../../../definition/IRoom';

export type LivechatRoomsEndpoint = {
	GET: (params: {
		guest: string;
		fname: string;
		servedBy: string[];
		status: string;
		department: string;
		from: string;
		to: string;
		customFields: any;
		current: number;
		itemsPerPage: number;
		tags: string[];
	}) => {
		rooms: IOmnichannelRoom[];
		count: number;
		offset: number;
		total: number;
	};
};
