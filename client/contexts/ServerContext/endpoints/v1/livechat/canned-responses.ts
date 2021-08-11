import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';
import { IOmnichannelCannedResponse } from '../../../../../../ee/client/omnichannel/cannedResponses/IOmnichannelCannedResponse';

export type CannedResponses = {
	GET: (params: { text: string; offset?: number | undefined; count?: number | undefined }) => {
		cannedResponses: ObjectFromApi<IOmnichannelCannedResponse>[];
		total: number;
	};
};
