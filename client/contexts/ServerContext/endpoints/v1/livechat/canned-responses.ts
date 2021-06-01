import { IOmnichannelCannedResponse } from '../../../../../../definition/IOmnichannelCannedResponse';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type CannedResponses = {
	GET: (params: {
		text: string;
		offset: number;
		count: number;
	}) => {
		cannedResponses: ObjectFromApi<IOmnichannelCannedResponse>[];
		total: number;
	};
};
