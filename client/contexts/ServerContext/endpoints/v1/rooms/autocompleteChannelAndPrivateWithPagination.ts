import { IRoom } from '../../../../../../definition/IRoom';

export type AutocompleteChannelAndPrivateEndpointWithPagination = {
	GET: (params: { selector: string; offset?: number; count?: number; sort?: string }) => {
		items: IRoom[];
		count: number;
		offset: number;
		total: number;
	};
};
